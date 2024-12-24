import OpenAI from "openai";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { NextResponse } from "next/server";


const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY
} = process.env

const openaiVar = new OpenAI ({
    apiKey: OPENAI_API_KEY
})

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, {namespace: ASTRA_DB_NAMESPACE})

export async function POST(req:Request) {
    try{
        const {messages} = await req.json();
        const latestMessage = messages[messages?.length -1]?.content

        let docContext = ""

        const embedding = await openaiVar.embeddings.create({
            model:"text-embedding-3-small",
            input: latestMessage,
            encoding_format:"float"
        })

        try{
            const collection = await db.collection(ASTRA_DB_COLLECTION)
            const cursor = collection.find(null, {
                sort:{
                    $vector: embedding.data[0].embedding,
                }, limit: 10
            })
            const documents = await cursor.toArray();
            const docsMap = documents?.map((doc) => doc.text)
            docContext = JSON.stringify(docsMap)
        } catch(err){
        console.log("Error: ", err)
        docContext = ""
    }

    const template = {
        role: "system",
        content: `
        You are an AI assistant who knows everything about Formula One. Use the below context to augment
        what you know about Formula One racing. The context will provide you with the most recent page data
        from Wikipedia. If the context doesn't include the information you need answer based on your existing
        knowledge and don't mention the source of your information or what the context does or doesn't include.
        Format responses using markdown where applicable and don't return images.
        ----------
        START CONTEXT
        ${docContext}
        END CONTEXT
        ----------
        QUESTION: ${latestMessage}
        ----------
        `
       
    }
        const result = streamText({
       // provider: openaiVar, // Pass the OpenAI client as part of the options
        model: openai("gpt-4"),
        messages: [template, ...messages],
    });
   
   // console.log(result.toDataStreamResponse());
    return result.toDataStreamResponse();
    
   
    } catch(err){
        console.error("Error in handler:", err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}