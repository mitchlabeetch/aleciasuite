import { fr } from "@/lib/i18n";

const formatWithCount = (template: string, count: number) =>
	template.replace("{count}", count.toString());

export const formatRelativeTime = (timestamp?: number) => {
	if (!timestamp) return fr.time.unknown;
	const diff = Math.max(Date.now() - timestamp, 0);
	const minutes = Math.floor(diff / 60000);

	if (minutes < 1) return fr.time.justNow;
	if (minutes < 60) {
		return formatWithCount(
			minutes === 1 ? fr.time.minuteAgo : fr.time.minutesAgo,
			minutes,
		);
	}

	const hours = Math.floor(minutes / 60);
	if (hours < 24) {
		return formatWithCount(
			hours === 1 ? fr.time.hourAgo : fr.time.hoursAgo,
			hours,
		);
	}

	const days = Math.floor(hours / 24);
	return formatWithCount(days === 1 ? fr.time.dayAgo : fr.time.daysAgo, days);
};
