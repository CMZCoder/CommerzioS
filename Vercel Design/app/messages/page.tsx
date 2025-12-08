"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Send, Paperclip, MoreVertical, Shield, Phone, Video, X } from "lucide-react"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(1)
  const [message, setMessage] = useState("")

  const conversations = [
    {
      id: 1,
      name: "Swiss Clean Pro",
      lastMessage: "I'll be there at 10 AM tomorrow",
      time: "2m ago",
      unread: 2,
      avatar: "SC",
      online: true,
      verified: true,
    },
    {
      id: 2,
      name: "AquaFix Switzerland",
      lastMessage: "The replacement parts have arrived",
      time: "1h ago",
      unread: 0,
      avatar: "AF",
      online: false,
      verified: true,
    },
    {
      id: 3,
      name: "FitLife Coaching",
      lastMessage: "Great session today! See you next week",
      time: "3h ago",
      unread: 0,
      avatar: "FL",
      online: true,
      verified: true,
    },
    {
      id: 4,
      name: "EduSwiss Tutoring",
      lastMessage: "Here are the practice problems we discussed",
      time: "1d ago",
      unread: 1,
      avatar: "ET",
      online: false,
      verified: true,
    },
  ]

  const currentMessages = [
    {
      id: 1,
      sender: "vendor",
      content: "Hello! Thank you for booking our cleaning service. I wanted to confirm the details for tomorrow.",
      time: "10:30 AM",
    },
    {
      id: 2,
      sender: "me",
      content: "Hi! Yes, looking forward to it. Will you need access to all rooms?",
      time: "10:32 AM",
    },
    {
      id: 3,
      sender: "vendor",
      content: "Yes please, it would be helpful. I'll bring all necessary cleaning supplies and equipment.",
      time: "10:33 AM",
    },
    {
      id: 4,
      sender: "me",
      content: "Perfect! Do you have parking available nearby?",
      time: "10:35 AM",
    },
    {
      id: 5,
      sender: "vendor",
      content: "I'll be there at 10 AM tomorrow. Looking forward to working with you!",
      time: "10:37 AM",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-1">
        <div className="h-[calc(100vh-80px)] max-w-[1600px] mx-auto px-4 py-4">
          <div className="h-full rounded-2xl overflow-hidden border border-border bg-card shadow-2xl">
            <div className="grid lg:grid-cols-[400px_1fr] h-full">
              {/* Conversations List */}
              <div
                className={`border-r border-border flex flex-col h-full bg-muted/30 ${selectedConversation ? "hidden lg:flex" : "flex"}`}
              >
                <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
                  <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Messages
                  </h1>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search conversations..." className="pl-10 bg-background border-border" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`w-full p-4 border-b border-border hover:bg-primary/5 transition-all duration-200 text-left flex items-start gap-3 ${
                        selectedConversation === conversation.id
                          ? "bg-gradient-to-r from-primary/10 to-accent/10 border-l-4 border-l-primary"
                          : ""
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-14 w-14 border-2 border-primary/20">
                          <AvatarFallback className="bg-gradient-to-br from-primary via-accent to-primary text-white font-bold text-base">
                            {conversation.avatar}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.online && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 border-2 border-card rounded-full ring-2 ring-green-500/20"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base truncate">{conversation.name}</h3>
                            {conversation.verified && (
                              <Shield className="h-4 w-4 text-accent fill-accent/20 flex-shrink-0" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{conversation.time}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-muted-foreground truncate leading-relaxed">
                            {conversation.lastMessage}
                          </p>
                          {conversation.unread > 0 && (
                            <Badge className="h-6 min-w-[24px] rounded-full px-2 flex items-center justify-center text-xs bg-gradient-to-br from-accent to-primary text-white shadow-lg shadow-primary/30 flex-shrink-0">
                              {conversation.unread}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className={`flex flex-col h-full ${!selectedConversation ? "hidden lg:flex" : "flex"}`}>
                <div className="p-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-accent/5">
                  <div className="flex items-center gap-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="lg:hidden -ml-2"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary via-accent to-primary text-white font-bold">
                        SC
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">Swiss Clean Pro</h3>
                        <Shield className="h-4 w-4 text-accent fill-accent/20" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-sm text-muted-foreground">Online now</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="hover:bg-primary/10 hover:text-primary rounded-full">
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="hover:bg-primary/10 hover:text-primary rounded-full">
                      <Video className="h-5 w-5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="rounded-full">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>View Service</DropdownMenuItem>
                        <DropdownMenuItem>View Booking</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Report</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b border-border">
                  <div className="bg-card rounded-2xl border border-primary/20 p-4 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center shadow-inner">
                          <span className="text-2xl">🧹</span>
                        </div>
                        <div>
                          <p className="font-semibold text-base">Professional Home Cleaning</p>
                          <p className="text-sm text-muted-foreground">Tomorrow, Dec 15 at 10:00 AM</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30 px-3 py-1">
                        Confirmed
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-muted/20 to-muted/5">
                  {currentMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div
                        className={`max-w-[75%] lg:max-w-[60%] ${
                          message.sender === "me"
                            ? "bg-gradient-to-br from-primary via-accent to-primary text-white shadow-xl shadow-primary/30"
                            : "bg-card border border-border shadow-md"
                        } rounded-3xl px-5 py-3.5 transition-all hover:scale-[1.02]`}
                      >
                        <p className={`text-sm leading-relaxed ${message.sender === "me" ? "text-white" : ""}`}>
                          {message.content}
                        </p>
                        <p
                          className={`text-xs mt-2 ${
                            message.sender === "me" ? "text-white/80" : "text-muted-foreground"
                          }`}
                        >
                          {message.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 border-t border-border bg-card">
                  <div className="flex items-end gap-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-primary/10 hover:text-primary rounded-full h-11 w-11"
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                      <Input
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="border-2 border-border focus:border-primary rounded-full px-5 py-6 text-base"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            setMessage("")
                          }
                        }}
                      />
                    </div>
                    <Button
                      size="icon"
                      className="bg-gradient-to-br from-primary via-accent to-primary hover:from-primary/90 hover:via-accent/90 hover:to-primary/90 shadow-xl shadow-primary/30 rounded-full h-11 w-11 transition-all hover:scale-105"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Messages are monitored for security · Be respectful and professional
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
