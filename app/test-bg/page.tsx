"use client"
import { useState, useEffect } from "react"

interface Question {
  id: string
  qid: number
  question: string
  answers: string[]
  correct: string
}

interface OlympiadQuestion {
  id: string
  question: string
  answers: string[]
  correct: string
}

interface ExtendedQuestion extends Question {
  isOlympiad?: boolean
  pointValue?: number
}

interface QuizData {
  version: number
  data: {
    "philosophy-12th": Array<{
      url: string
      questions: Question[]
    }>
  }
}

export default function TestBGPage() {
  const [allQuestions, setAllQuestions] = useState<ExtendedQuestion[]>([])
  const [olympiadQuestions, setOlympiadQuestions] = useState<ExtendedQuestion[]>([])
  const [includeOlympiad, setIncludeOlympiad] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<ExtendedQuestion | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  useEffect(() => {
    fetch("/data/bg_rc-v1.0-3.json")
      .then((res) => res.json())
      .then((jsonData: QuizData) => {
        const questions: ExtendedQuestion[] = []
        jsonData.data["philosophy-12th"].forEach((section) => {
          section.questions.forEach((q) => {
            questions.push({ ...q, isOlympiad: false, pointValue: 1 })
          })
        })
        setAllQuestions(questions)
        if (questions.length > 0) {
          const randomIndex = Math.floor(Math.random() * questions.length)
          setCurrentQuestion(questions[randomIndex])
        }
      })
      .catch((error) => {
        console.error("[v0] Failed to load questions:", error)
      })

    fetch("/images/philosophy-olympiad-all-281-29.csv")
      .then((res) => res.text())
      .then((csvText) => {
        const lines = csvText.split("\n").filter((line) => line.trim())
        const questions: ExtendedQuestion[] = []

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i]
          const fields: string[] = []
          let currentField = ""
          let inQuotes = false

          for (let j = 0; j < line.length; j++) {
            const char = line[j]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === "," && !inQuotes) {
              fields.push(currentField.trim())
              currentField = ""
            } else {
              currentField += char
            }
          }
          fields.push(currentField.trim())

          if (fields.length >= 4) {
            const id = fields[0].replace(/^"|"$/g, "")
            const question = fields[1].replace(/^"|"$/g, "")
            const answersStr = fields[2].replace(/^"|"$/g, "")
            const correct = fields[3].replace(/^"|"$/g, "")

            const answers = answersStr
              .split(";")
              .map((a) => a.trim())
              .filter((a) => a)

            if (question && answers.length > 0 && correct) {
              questions.push({
                id,
                qid: i,
                question,
                answers,
                correct,
                isOlympiad: true,
                pointValue: 3,
              })
            }
          }
        }

        console.log("[v0] Loaded olympiad questions:", questions.length)
        setOlympiadQuestions(questions)
      })
      .catch((error) => {
        console.error("[v0] Failed to load olympiad questions:", error)
      })
  }, [])

  const handleAnswerClick = (answer: string) => {
    if (isAnswered) return

    setSelectedAnswer(answer)
    setIsAnswered(true)

    const correct = answer === currentQuestion?.correct
    setIsCorrect(correct)

    if (correct) {
      const points = currentQuestion?.pointValue || 1
      setScore((prev) => prev + points)
    } else {
      setScore((prev) => prev - 5)
    }
  }

  const handleNext = () => {
    const availableQuestions = includeOlympiad ? [...allQuestions, ...olympiadQuestions] : allQuestions

    if (availableQuestions.length === 0) return

    const randomIndex = Math.floor(Math.random() * availableQuestions.length)
    setCurrentQuestion(availableQuestions[randomIndex])
    setSelectedAnswer(null)
    setIsAnswered(false)
    setIsCorrect(null)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-serif p-4">
      <div className="w-[120px] h-[120px] mb-2 flex items-center justify-center">
        <img src="/images/camus.png" alt="Camus" className="h-[120px] object-contain" />
      </div>

      <h1 className="text-xl mb-1">
        <a href="https://soffy.ing" className="text-red-600 underline hover:text-red-500 transition-colors">
          soffy.ing
        </a>
      </h1>

      <nav className="flex gap-6 mb-4 text-sm">
        <a href="/" className="text-zinc-400 hover:text-white transition-colors">
          write
        </a>
        <a href="/about" className="text-zinc-400 hover:text-white transition-colors">
          about
        </a>
        <a href="/test-bg" className="text-white underline">
          test (BG)
        </a>
      </nav>

      <div className="w-full max-w-3xl">
        <div className="mb-4 text-center">
          <h2 className="text-lg text-lime-400 mb-1">Матура по философия (BG)</h2>
          <div className="text-base">
            Score: <span className={score >= 0 ? "text-lime-400" : "text-red-600"}>{score}</span>
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-sm text-zinc-400">Include Olympiad questions:</span>
            <button
              onClick={() => setIncludeOlympiad(!includeOlympiad)}
              className="text-sm text-white hover:text-lime-400 transition-colors cursor-pointer font-mono"
            >
              {includeOlympiad ? "[y]" : "y"}/{includeOlympiad ? "n" : "[n]"}
            </button>
          </div>
        </div>

        {currentQuestion ? (
          <div className="border border-zinc-700 p-6">
            {currentQuestion.isOlympiad && (
              <div className="mb-3">
                <span className="text-xs text-purple-400">[Olympiad Question: +3 points]</span>
              </div>
            )}

            <div className="mb-4">
              <p className="text-base leading-relaxed">{currentQuestion.question}</p>
            </div>

            <div className="space-y-2 mb-4">
              {currentQuestion.answers.map((answer, index) => {
                const isSelected = selectedAnswer === answer
                const isCorrectAnswer = answer === currentQuestion.correct
                let buttonClass =
                  "w-full text-left p-3 border transition-colors cursor-pointer bg-black border-zinc-700 hover:border-zinc-500 hover:text-lime-400"

                if (isAnswered) {
                  if (isCorrectAnswer) {
                    buttonClass = "w-full text-left p-3 border bg-black border-lime-600 text-lime-400 cursor-default"
                  } else if (isSelected) {
                    buttonClass = "w-full text-left p-3 border bg-black border-red-600 text-red-600 cursor-default"
                  } else {
                    buttonClass = "w-full text-left p-3 border bg-black border-zinc-700 opacity-50 cursor-default"
                  }
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerClick(answer)}
                    className={buttonClass}
                    disabled={isAnswered}
                  >
                    {answer}
                  </button>
                )
              })}
            </div>

            {isAnswered && (
              <div className="space-y-3 border-t border-zinc-700 pt-3">
                <div className="text-center">
                  {isCorrect ? (
                    <p className="text-lime-400 text-base">
                      [Correct! +{currentQuestion.pointValue || 1} point
                      {(currentQuestion.pointValue || 1) > 1 ? "s" : ""}]
                    </p>
                  ) : (
                    <div>
                      <p className="text-red-600 text-base mb-1">[Incorrect! -5 points]</p>
                      <p className="text-zinc-400 text-sm">Correct answer: {currentQuestion.correct}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 text-black bg-lime-400 hover:bg-lime-300 transition-colors cursor-pointer border-none"
                  >
                    [Next Question]
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-zinc-400">Loading questions...</div>
        )}
      </div>
    </div>
  )
}
