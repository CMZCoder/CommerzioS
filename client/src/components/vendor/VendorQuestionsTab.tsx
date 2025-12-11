import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ListingQuestion, type ListingAnswer, type Service, type User } from "@shared/schema";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Lock, Reply, ExternalLink } from "lucide-react";
import { Link } from "wouter";

type VendorQuestion = ListingQuestion & {
    user: User;
    service: Service;
    answers: Array<ListingAnswer & { user: User }>;
};

export function VendorQuestionsTab() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: questions = [], isLoading } = useQuery<VendorQuestion[]>({
        queryKey: ["/api/vendor/questions"],
    });

    const replyMutation = useMutation({
        mutationFn: async ({ questionId, content, isPrivate }: { questionId: string; content: string; isPrivate: boolean }) => {
            return apiRequest(`/api/questions/${questionId}/answers`, {
                method: "POST",
                body: JSON.stringify({ content, isPrivate }),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/vendor/questions"] });
            toast({ title: "Reply submitted" });
        },
        onError: (error: any) => {
            toast({ title: "Failed to reply", description: error.message, variant: "destructive" });
        },
    });

    if (isLoading) return <div>Loading questions...</div>;

    const pendingQuestions = questions.filter(q => !q.isAnswered);
    const answeredQuestions = questions.filter(q => q.isAnswered);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Questions on your Listings</CardTitle>
                    <CardDescription>Manage questions asked by customers on your services.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Pending Questions */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            Pending <Badge variant="secondary">{pendingQuestions.length}</Badge>
                        </h3>
                        {pendingQuestions.length === 0 ? (
                            <p className="text-muted-foreground italic">No pending questions.</p>
                        ) : (
                            pendingQuestions.map(q => (
                                <VendorQuestionItem key={q.id} question={q} onReply={(content, isPrivate) => replyMutation.mutate({ questionId: q.id, content, isPrivate })} />
                            ))
                        )}
                    </div>

                    {/* Answered Questions */}
                    {answeredQuestions.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                Answered History <Badge variant="outline">{answeredQuestions.length}</Badge>
                            </h3>
                            {answeredQuestions.map(q => (
                                <VendorQuestionItem key={q.id} question={q} onReply={(content, isPrivate) => replyMutation.mutate({ questionId: q.id, content, isPrivate })} readOnly={true} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function VendorQuestionItem({ question, onReply, readOnly }: { question: VendorQuestion, onReply: (content: string, isPrivate: boolean) => void, readOnly?: boolean }) {
    const [replyContent, setReplyContent] = useState("");
    const [isPrivateReply, setIsPrivateReply] = useState(false);
    const [isReplying, setIsReplying] = useState(false);

    const handleReply = () => {
        if (!replyContent.trim()) return;
        onReply(replyContent, isPrivateReply);
        setIsReplying(false);
    };

    return (
        <Card className="bg-muted/50 border-l-4 border-l-primary mb-4 last:mb-0">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <span className="font-semibold text-foreground">{question.user.firstName} {question.user.lastName}</span>
                            <span>on</span>
                            <Link href={`/service/${question.serviceId}`} className="flex items-center hover:underline">
                                {question.service.title} <ExternalLink className="w-3 h-3 ml-1" />
                            </Link>
                            <span>• {new Date(question.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-base">{question.content}</p>
                    </div>
                    {question.isPrivate && <Badge variant="outline" className="ml-2"><Lock className="w-3 h-3 mr-1" /> Private</Badge>}
                </div>

                {/* If answered, show answer */}
                {question.answers && question.answers.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 bg-background/50 p-2 rounded">
                        <p className="text-sm font-semibold mb-1">Your Answer:</p>
                        {question.answers.map(a => (
                            <div key={a.id}>
                                <p className="text-sm">{a.content}</p>
                            </div>
                        ))}
                    </div>
                )}

                {!readOnly && !question.isAnswered && (
                    <div className="mt-4">
                        {!isReplying ? (
                            <Button size="sm" onClick={() => setIsReplying(true)}>
                                <Reply className="w-4 h-4 mr-2" /> Reply
                            </Button>
                        ) : (
                            <div className="space-y-3">
                                <Textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Type your answer..."
                                />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`private-reply-${question.id}`}
                                            checked={isPrivateReply}
                                            onChange={(e) => setIsPrivateReply(e.target.checked)}
                                            className="h-4 w-4"
                                        />
                                        <label htmlFor={`private-reply-${question.id}`} className="text-sm text-muted-foreground select-none">Hide this question (Reply privately)</label>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>Cancel</Button>
                                        <Button size="sm" onClick={handleReply}>Submit Answer</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
