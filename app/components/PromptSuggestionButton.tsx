const PromptSuggestionButton = ({text, onClick}) => {
    const prompts = [
        "Who is the head of racing for Aston Martin's F1 Academy team?",
        "Who is the highest paid F1 driver?",
        "Who will be the newest driver for Ferrari?",
        "Who is the current F1 World Driver's Champion?"
    ]
    return (
        <button className="prompt-suggestion-button" onClick={onClick}>
            {text}
        </button>
    )
}

export default PromptSuggestionButton