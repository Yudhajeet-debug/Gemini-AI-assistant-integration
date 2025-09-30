import React, { useState, useEffect, useRef } from "react"

// --- useTypewriter Hook ---
function useTypewriter(text: string, speed = 30): string {
    const [displayText, setDisplayText] = useState<string>("")
    const [index, setIndex] = useState<number>(0)

    useEffect(() => {
        setDisplayText("")
        setIndex(0)
    }, [text])

    useEffect(() => {
        if (index < text.length) {
            const timeoutId = setTimeout(() => {
                setDisplayText((prev: string) => prev + text.charAt(index))
                setIndex((prev: number) => prev + 1)
            }, speed)
            return () => clearTimeout(timeoutId)
        }
    }, [index, text, speed])

    return displayText
}

// --- TypewriterMessage Component ---
interface TypewriterMessageProps {
    text: string
}
const TypewriterMessage: React.FC<TypewriterMessageProps> = ({
    text,
}: TypewriterMessageProps) => {
    const displayText = useTypewriter(text)
    return <>{displayText}</>
}

interface Message {
    text: string
    sender: "user" | "bot"
}

const callGeminiAPI = async (
    chatHistory: Message[],
    apiKey: string,
    userName: string,
    userGender: string
) => {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`

    const systemInstruction = {
        parts: [
            {
                text: `
                --------------------------------------------------------------------------------------------------------------------------------------------------
                --------------------------------------------------------------------------------------------------------------------------------------------------
                --------------------------------------------------------------------------------------------------------------------------------------------------
`,
            },
        ],
    }

    const contents = chatHistory.map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
    }))

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents,
                systemInstruction,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error("Gemini API error:", errorData)
            let errorMessage = "An unknown error occurred."
            if (errorData && errorData.error && errorData.error.message) {
                errorMessage = errorData.error.message
            }
            return `Error: ${errorMessage}`
        }

        const data = await response.json()
        if (
            data.candidates &&
            data.candidates.length > 0 &&
            data.candidates[0].content &&
            data.candidates[0].content.parts &&
            data.candidates[0].content.parts.length > 0
        ) {
            return data.candidates[0].content.parts[0].text
        } else {
            console.error("Unexpected API response format:", data)
            return "Sorry, I received an unexpected response from the API."
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error)
        return "Sorry, something went wrong while connecting to the API."
    }
}

// --- GeminiChat Component for Framer ---

export default function GeminiChat() {
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState<string>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [userName, setUserName] = useState<string>("")
    const [userGender, setUserGender] = useState<string>("") // 'male', 'female', 'other'
    const [isConfigured, setIsConfigured] = useState<boolean>(false)
    const messageListRef = useRef<HTMLDivElement>(null)

    const handleStartChat = () => {
        if (userName.trim() && userGender) {
            setIsConfigured(true)
        } else {
            alert("Please enter your name and select a gender.")
        }
    }

    const handleSendMessage = async (): Promise<void> => {
        if (inputValue.trim()) {
            const currentInputValue = inputValue
            const newMessages = [
                ...messages,
                { text: currentInputValue, sender: "user" as const },
            ]
            setMessages(newMessages)
            setInputValue("")
            setIsLoading(true)

            // IMPORTANT: Replace with your actual API key
            const API_KEY = "YOUR_GEMINI_API_KEY"

            if (API_KEY === "YOUR_GEMINI_API_KEY" || !API_KEY) {
                setMessages((prevMessages: Message[]) => [
                    ...prevMessages,
                    {
                        text: "Please add your Gemini API key to use this component.",
                        sender: "bot",
                    },
                ])
                setIsLoading(false)
            } else {
                const botResponse = await callGeminiAPI(
                    newMessages,
                    API_KEY,
                    userName,
                    userGender
                )
                setMessages([
                    ...newMessages,
                    { text: botResponse, sender: "bot" as const },
                ])
                setIsLoading(false)
            }
        }
    }

    // Auto-scroll to bottom on new message
    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop =
                messageListRef.current.scrollHeight
        }
    }, [messages, isLoading])

    if (!isConfigured) {
        return (
            <>
                <link
                    href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap"
                    rel="stylesheet"
                />
                <style>{`
          .config-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            width: 100%;
            background-color: #1a1a1a;
            color: #f0f0f0;
            font-family: 'Google Sans', sans-serif;
            padding: 20px;
            text-align: center;
          }
          .config-container h2 {
              margin-bottom: 10px;
              font-size: 2em;
          }
          .config-container p {
              margin-bottom: 30px;
              font-size: 1.2em;
              color: #aaa;
          }
          .config-input {
              padding: 18px;
              border: 2px solid #444;
              border-radius: 25px;
              background-color: #2a2a2a;
              color: #f0f0f0;
              font-size: 1.1em;
              width: 80%;
              max-width: 400px;
              margin-bottom: 20px;
              text-align: center;
          }
          .gender-chooser {
              display: flex;
              gap: 15px;
              margin-bottom: 30px;
          }
          .gender-button {
              padding: 15px 30px;
              border: 2px solid #444;
              background-color: transparent;
              color: #f0f0f0;
              border-radius: 25px;
              cursor: pointer;
              font-size: 1.1em;
              transition: all 0.3s;
          }
          .gender-button.selected {
              background: linear-gradient(90deg, #8a2be2 0%, #4169e1 100%);
              border-color: transparent;
          }
          .start-button {
              padding: 15px 35px;
              border: none;
              background: linear-gradient(90deg, #16a085 0%, #27ae60 100%);
              color: white;
              border-radius: 25px;
              cursor: pointer;
              font-size: 1.2em;
              font-weight: bold;
              transition: transform 0.2s;
          }
          .start-button:hover {
              transform: scale(1.05);
          }
        `}</style>
                <div className="config-container">
                    <h2>Welcome to IRP Helper!</h2>
                    <p>First, let's get to know you a bit.</p>
                    <input
                        type="text"
                        placeholder="What's your name?"
                        value={userName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setUserName(e.target.value)
                        }
                        className="config-input"
                    />
                    <div className="gender-chooser">
                        <button
                            className={`gender-button ${userGender === "male" ? "selected" : ""}`}
                            onClick={() => setUserGender("male")}
                            aria-pressed={userGender === "male"}
                        >
                            Male
                        </button>
                        <button
                            className={`gender-button ${userGender === "female" ? "selected" : ""}`}
                            onClick={() => setUserGender("female")}
                            aria-pressed={userGender === "female"}
                        >
                            Female
                        </button>
                        <button
                            className={`gender-button ${userGender === "other" ? "selected" : ""}`}
                            onClick={() => setUserGender("other")}
                            aria-pressed={userGender === "other"}
                        >
                            Other
                        </button>
                    </div>
                    <button onClick={handleStartChat} className="start-button">
                        Start Chatting
                    </button>
                </div>
            </>
        )
    }

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap"
                rel="stylesheet"
            />
            <style>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          background-color: #1a1a1a;
          color: #f0f0f0;
          font-family: 'Google Sans', sans-serif;
          font-size: 1.1em;
        }

        .message-list {
          flex-grow: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .message {
          margin-bottom: 15px;
          padding: 12px 18px;
          border-radius: 18px;
          max-width: 85%;
          line-height: 1.6;
        }

        .message.user {
          background: linear-gradient(90deg, #4b6cb7 0%, #182848 100%);
          color: white;
          align-self: flex-end;
          border-radius: 25px 25px 5px 25px;
        }

        .message.bot {
          background-color: #333;
          align-self: flex-start;
          border-radius: 25px 25px 25px 5px;
        }

        @keyframes jump {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        .loading-indicator span {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #8ab4f8;
          margin: 0 3px;
          animation: jump 1.2s infinite;
        }

        .loading-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .loading-indicator span:nth-child(3) { animation-delay: 0.4s; }

        .input-area {
          display: flex;
          padding: 20px;
          border-top: 1px solid #444;
        }

        @keyframes glowing {
          0% { box-shadow: 0 0 8px #8a2be2, 0 0 12px #8a2be2, 0 0 18px #4169e1, 0 0 24px #4169e1; }
          50% { box-shadow: 0 0 12px #4169e1, 0 0 18px #4169e1, 0 0 24px #8a2be2, 0 0 30px #8a2be2; }
          100% { box-shadow: 0 0 8px #8a2be2, 0 0 12px #8a2be2, 0 0 18px #4169e1, 0 0 24px #4169e1; }
        }

        .input-area input {
          flex-grow: 1;
          padding: 18px;
          border: 2px solid transparent;
          border-radius: 25px;
          animation: glowing 4s infinite;
          background-color: #2a2a2a;
          color: #f0f0f0;
          font-size: 1.1em;
          outline: none;
        }

        .input-area button {
          margin-left: 15px;
          padding: 15px 25px;
          border: none;
          background: linear-gradient(90deg, #8a2be2 0%, #4169e1 100%);
          color: white;
          border-radius: 25px;
          cursor: pointer;
          font-size: 1.1em;
          font-weight: bold;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .input-area button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 15px rgba(138, 43, 226, 0.7);
        }
      `}</style>
            <div className="chat-container">
                <div
                    className="message-list"
                    ref={messageListRef}
                    role="log"
                    aria-live="polite"
                >
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`message ${message.sender}`}
                            aria-label={
                                message.sender === "bot"
                                    ? "Bot message"
                                    : "User message"
                            }
                        >
                            {message.sender === "bot" ? (
                                <TypewriterMessage text={message.text} />
                            ) : (
                                message.text
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message bot" aria-label="Bot is typing">
                            <div className="loading-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="input-area">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setInputValue(e.target.value)
                        }
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                            e.key === "Enter" && handleSendMessage()
                        }
                        placeholder="Type your message..."
                        aria-label="Type your message"
                    />
                    <button
                        onClick={handleSendMessage}
                        aria-label="Send message"
                    >
                        Send
                    </button>
                </div>
            </div>
        </>
    )
}

