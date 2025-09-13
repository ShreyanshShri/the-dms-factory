const moment = require("moment-timezone");

class WorkingHoursService {
	static isWithinWorkingHours(workingHours = { start: 0, end: 24 }) {
		const now = moment().tz("America/Los_Angeles");
		const currentHour = now.hour();
		return currentHour >= workingHours.start && currentHour < workingHours.end;
	}

	static getWorkingHoursProgress() {
		const now = moment().tz("America/New_York");
		const currentHour = now.hour();
		const currentMinute = now.minute();
		const totalMinutesInWorkDay = 24 * 60;
		const minutesElapsed = currentHour * 60 + currentMinute;
		const progressPercentage = Math.floor(
			(minutesElapsed / totalMinutesInWorkDay) * 100
		);
		const currentTimeET = now.format("HH:mm");
		const dateFormatted = now.format("DD-MM-YYYY");
		return {
			progressThroughWorkDay: `${progressPercentage}%`,
			currentTimeET,
			dateFormatted,
		};
	}
}

module.exports = WorkingHoursService;

// const moment = require("moment-timezone");

// class WorkingHoursService {
// 	static isWithinWorkingHours(workingHours = { start: 0, end: 24 }) {
// 		const now = moment().tz("America/Los_Angeles");
// 		const currentHour = now.hour();

// 		return currentHour >= workingHours.start && currentHour < workingHours.end;
// 	}

// 	static getWorkingHoursProgress() {
// 		const now = moment().tz("America/New_York");
// 		const currentHour = now.hour();
// 		const currentMinute = now.minute();

// 		const totalMinutesInWorkDay = 24 * 60; // Assuming 24-hour work day
// 		const minutesElapsed = currentHour * 60 + currentMinute;

// 		const progressPercentage = Math.floor(
// 			(minutesElapsed / totalMinutesInWorkDay) * 100
// 		);
// 		const currentTimeET = now.format("HH:mm");
// 		const dateFormatted = now.format("DD-MM-YYYY");

// 		return {
// 			progressThroughWorkDay: `${progressPercentage}%`,
// 			currentTimeET,
// 			dateFormatted,
// 		};
// 	}
// }

// module.exports = WorkingHoursService;
