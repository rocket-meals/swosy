// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Content toggles controlling which metrics are read aloud in periodic TTS
 * announcements. Shared between the runtime announcement builder
 * (`TTSHelper.ts`'s `PeriodicAnnouncementContent`) and the persisted user
 * preferences (`store/speechSettingsSlice.ts`'s `SpeechSettingsState`).
 */
export type AnnouncementToggles = {
	announceDistance: boolean;
	announcePace: boolean;
	announceDuration: boolean;
	announceSpeed: boolean;
	announceCalories: boolean;
	announceHeartRate: boolean;
	/** Announce average pace (min/km) in periodic updates */
	announcePaceAvg: boolean;
	/** Announce average speed (km/h, derived from avg pace) in periodic updates */
	announceSpeedAvg: boolean;
};
