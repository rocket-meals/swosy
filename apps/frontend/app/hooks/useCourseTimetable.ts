import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { DatabaseTypes } from 'repo-depkit-common';
import { useAppSelector } from '@/redux/hooks';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import { UPDATE_PROFILE } from '@/redux/Types/types';
import { CourseTimetableEvent, normalizeCourseTimetable, removeEvent, serializeCourseTimetable, upsertEvent } from '@/helper/courseTimetable/CourseTimetableModel';

/**
 * The user's course timetable, stored in `profiles.course_timetable`.
 *
 * Signed-in users save to the server; guests without a profile id keep it in the local
 * profile (same as before). All writers go through {@link saveEvents}, so modals that read
 * the events by id always see the latest state.
 */
export default function useCourseTimetable() {
	const dispatch = useDispatch();
	const profile = useAppSelector(state => state.authReducer.profile) as DatabaseTypes.Profiles | null;

	const events = useMemo(() => normalizeCourseTimetable(profile?.course_timetable), [profile?.course_timetable]);

	const saveEvents = useCallback(
		async (nextEvents: CourseTimetableEvent[]) => {
			const course_timetable = serializeCourseTimetable(nextEvents);
			// Update the local state first so the UI reacts immediately, then persist.
			dispatch({ type: UPDATE_PROFILE, payload: { ...profile, course_timetable } });
			if (profile?.id) {
				try {
					const result = (await new ProfileHelper().updateProfile({ id: profile.id, course_timetable })) as DatabaseTypes.Profiles;
					if (result) {
						dispatch({ type: UPDATE_PROFILE, payload: result });
					}
				} catch (error) {
					console.error('Course timetable: could not save', error);
				}
			}
		},
		[dispatch, profile]
	);

	const saveEvent = useCallback((event: CourseTimetableEvent) => saveEvents(upsertEvent(events, event)), [events, saveEvents]);
	const deleteEvent = useCallback((id: string) => saveEvents(removeEvent(events, id)), [events, saveEvents]);

	return { events, saveEvents, saveEvent, deleteEvent };
}
