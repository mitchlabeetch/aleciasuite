"use client";

/**
 * Data Room Q&A Management
 *
 * Manage questions and answers for a data room:
 * - List all questions with status filters
 * - Answer questions
 * - Update question status
 * - Track response times
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
	FolderLock,
	MessageSquare,
	ArrowLeft,
	Loader2,
	CheckCircle,
	Clock,
	AlertCircle,
	XCircle,
	Send,
	User,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getDealRoom, getQuestions, answerQuestion } from "@/actions";

// Type definitions
interface Question {
	id: string;
	roomId: string;
	documentId: string | null;
	folderId: string | null;
	question: string;
	askedBy: string;
	askedByName: string | null;
	askedAt: Date | null;
	answer: string | null;
	answeredBy: string | null;
	answeredAt: Date | null;
	status: "open" | "answered" | "clarification_needed" | "declined";
	isPrivate: boolean | null;
	answererName?: string;
}

// Status configuration
const STATUS_CONFIG: Record<
	string,
	{ label: string; icon: React.ElementType; color: string }
> = {
	open: {
		label: "En attente",
		icon: Clock,
		color: "text-orange-600 bg-orange-100",
	},
	answered: {
		label: "Répondu",
		icon: CheckCircle,
		color: "text-green-600 bg-green-100",
	},
	clarification_needed: {
		label: "Clarification",
		icon: AlertCircle,
		color: "text-blue-600 bg-blue-100",
	},
	declined: {
		label: "Refusé",
		icon: XCircle,
		color: "text-red-600 bg-red-100",
	},
};

// Format date
function formatDate(date: Date | null): string {
	if (!date) return "Date inconnue";
	return new Date(date).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

// Question card component
function QuestionCard({
	question,
	onAnswer,
}: {
	question: Question;
	onAnswer: (question: Question) => void;
}) {
	const statusConfig = STATUS_CONFIG[question.status] || STATUS_CONFIG.open;
	const StatusIcon = statusConfig.icon;

	return (
		<Card className="hover:shadow-md transition-shadow">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-2">
						<div
							className={`h-8 w-8 rounded-full flex items-center justify-center ${statusConfig.color}`}
						>
							<StatusIcon className="h-4 w-4" />
						</div>
						<div>
							<p className="font-medium">{question.askedByName}</p>
							<p className="text-xs text-muted-foreground">
								{formatDate(question.askedAt)}
							</p>
						</div>
					</div>
					<Badge variant={question.status === "open" ? "default" : "secondary"}>
						{statusConfig.label}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Question */}
				<div className="bg-muted/50 rounded-lg p-3">
					<p className="text-sm">{question.question}</p>
				</div>

				{/* Answer */}
				{question.answer && (
					<div className="border-l-2 border-primary pl-3">
						<div className="flex items-center gap-2 mb-1">
							<User className="h-3 w-3 text-muted-foreground" />
							<span className="text-xs text-muted-foreground">
								{question.answererName} •{" "}
								{question.answeredAt && formatDate(question.answeredAt)}
							</span>
						</div>
						<p className="text-sm">{question.answer}</p>
					</div>
				)}

				{/* Actions */}
				{question.status === "open" && (
					<Button
						variant="outline"
						className="w-full"
						onClick={() => onAnswer(question)}
					>
						<Send className="h-4 w-4 mr-2" />
						Répondre
					</Button>
				)}
			</CardContent>
		</Card>
	);
}

// Answer dialog
function AnswerDialog({
	question,
	open,
	onOpenChange,
	onAnswered,
}: {
	question: Question | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAnswered: () => void;
}) {
	const { toast } = useToast();
	const [answer, setAnswer] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();

	const handleSubmit = async () => {
		if (!question || !answer.trim()) {
			toast({
				title: "Erreur",
				description: "Veuillez entrer une réponse.",
				variant: "destructive",
			});
			return;
		}

		setIsSubmitting(true);
		try {
			await answerQuestion({ questionId: question.id, answer: answer.trim() });

			toast({ title: "Réponse envoyée" });
			setAnswer("");
			onOpenChange(false);
			onAnswered();
			router.refresh();
		} catch {
			toast({
				title: "Erreur",
				description: "Impossible d'envoyer la réponse.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Répondre à la question</DialogTitle>
					<DialogDescription>De: {question?.askedByName}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Original question */}
					<div className="bg-muted/50 rounded-lg p-3">
						<p className="text-sm font-medium mb-1">Question:</p>
						<p className="text-sm">{question?.question}</p>
					</div>

					{/* Answer input */}
					<div>
						<label className="text-sm font-medium mb-2 block">
							Votre réponse:
						</label>
						<Textarea
							value={answer}
							onChange={(e) => setAnswer(e.target.value)}
							placeholder="Entrez votre réponse..."
							rows={5}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Annuler
					</Button>
					<Button onClick={handleSubmit} disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Envoi...
							</>
						) : (
							<>
								<Send className="h-4 w-4 mr-2" />
								Envoyer
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function DataRoomQAPage() {
	const params = useParams();
	const roomId = params.roomId as string;

	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
		null,
	);
	const [answerDialogOpen, setAnswerDialogOpen] = useState(false);

	// Data state
	const [room, setRoom] = useState<any>(null);
	const [questions, setQuestions] = useState<Question[] | null>(null);

	// Fetch data
	useEffect(() => {
		getDealRoom(roomId).then(setRoom);
		getQuestions(roomId).then(data => setQuestions((data ?? null) as any));
	}, [roomId]);

	if (!room) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const questionList = (questions || []) as Question[];
	const filteredQuestions =
		statusFilter === "all"
			? questionList
			: questionList.filter((q) => q.status === statusFilter);

	const stats = {
		total: questionList.length,
		open: questionList.filter((q) => q.status === "open").length,
		answered: questionList.filter((q) => q.status === "answered").length,
	};

	const handleOpenAnswer = (question: Question) => {
		setSelectedQuestion(question);
		setAnswerDialogOpen(true);
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Link href={`/admin/data-rooms/${roomId}`}>
					<Button variant="ghost" size="icon">
						<ArrowLeft className="h-4 w-4" />
					</Button>
				</Link>
				<div>
					<div className="flex items-center gap-2">
						<MessageSquare className="h-6 w-6 text-primary" />
						<h1 className="text-2xl font-bold">Questions & Réponses</h1>
					</div>
					<p className="text-muted-foreground flex items-center gap-2">
						<FolderLock className="h-4 w-4" />
						{room.name}
					</p>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-3 gap-4">
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center gap-2">
							<MessageSquare className="h-5 w-5 text-muted-foreground" />
							<div>
								<p className="text-2xl font-bold">{stats.total}</p>
								<p className="text-xs text-muted-foreground">Total</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card
					className={
						stats.open > 0 ? "border-orange-500/30 bg-orange-500/5" : ""
					}
				>
					<CardContent className="pt-4">
						<div className="flex items-center gap-2">
							<Clock
								className={`h-5 w-5 ${stats.open > 0 ? "text-orange-600" : "text-muted-foreground"}`}
							/>
							<div>
								<p
									className={`text-2xl font-bold ${stats.open > 0 ? "text-orange-600" : ""}`}
								>
									{stats.open}
								</p>
								<p className="text-xs text-muted-foreground">En attente</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center gap-2">
							<CheckCircle className="h-5 w-5 text-green-600" />
							<div>
								<p className="text-2xl font-bold text-green-600">
									{stats.answered}
								</p>
								<p className="text-xs text-muted-foreground">Répondues</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Questions list */}
			<Tabs value={statusFilter} onValueChange={setStatusFilter}>
				<TabsList>
					<TabsTrigger value="all">Toutes ({stats.total})</TabsTrigger>
					<TabsTrigger value="open">En attente ({stats.open})</TabsTrigger>
					<TabsTrigger value="answered">
						Répondues ({stats.answered})
					</TabsTrigger>
				</TabsList>

				<TabsContent value={statusFilter} className="mt-4">
					{filteredQuestions.length === 0 ? (
						<Card className="py-12">
							<CardContent className="text-center">
								<MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<h3 className="font-semibold mb-2">Aucune question</h3>
								<p className="text-muted-foreground">
									{statusFilter === "open"
										? "Aucune question en attente de réponse."
										: "Les questions apparaîtront ici."}
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{filteredQuestions.map((question) => (
								<QuestionCard
									key={question.id}
									question={question}
									onAnswer={handleOpenAnswer}
								/>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* Answer dialog */}
			<AnswerDialog
				question={selectedQuestion}
				open={answerDialogOpen}
				onOpenChange={setAnswerDialogOpen}
				onAnswered={() => {}}
			/>
		</div>
	);
}
