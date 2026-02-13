import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json({
		status: "ok",
		app: "alecia-colab",
		timestamp: new Date().toISOString(),
	});
}
