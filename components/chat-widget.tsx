"use client"

import type React from "react"

import { useState } from "react"
import { MessageCircle, X, Send, Bot } from "lucide-react"

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle message sending logic here
      setMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={toggleChat}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 animate-bounce"
        >
          <MessageCircle size={24} />
        </button>
      </div>

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-24 right-2 sm:right-6 w-72 sm:w-80 bg-white rounded-lg shadow-2xl z-50 max-h-96 sm:max-h-none">
          <div className="bg-blue-600 text-white p-3 sm:p-4 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm sm:text-base">แชทสดช่วยเหลือ</h3>
              <button onClick={toggleChat} className="text-white hover:text-gray-200 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="p-3 sm:p-4 h-48 sm:h-64 overflow-y-auto">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-2">
                <div className="w-7 sm:w-8 h-7 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="text-white" size={14} />
                </div>
                <div className="bg-gray-100 p-2 sm:p-3 rounded-lg max-w-xs">
                  <p className="text-xs sm:text-sm text-gray-900 font-medium">
                    สวัสดี! ฉันสามารถช่วยคุณค้นหาอสังหาริมทรัพย์ในฝันได้อย่างไร?
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 sm:p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="พิมพ์ข้อความของคุณ..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-2 sm:px-3 py-2 border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 font-medium placeholder:text-gray-500"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
