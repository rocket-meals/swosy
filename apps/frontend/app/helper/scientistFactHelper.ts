import { FamousScientist } from 'repo-depkit-common';
import { TranslationKeys } from '@/locales/keys';

/**
 * Kurzer Fakt zu jeder Person aus `FAMOUS_SCIENTISTS` – erklärt im Onboarding, warum ein neues Profil
 * z. B. `Curie_4821` heißt. Schlüssel ist `FamousScientist.nickname`; `scientistFactHelper.test.ts`
 * stellt sicher, dass keine Person ohne Text bleibt.
 */
export const SCIENTIST_FACT_KEYS: Record<string, TranslationKeys> = {
	Einstein: TranslationKeys.scientist_fact_einstein,
	Curie: TranslationKeys.scientist_fact_curie,
	Lovelace: TranslationKeys.scientist_fact_lovelace,
	Newton: TranslationKeys.scientist_fact_newton,
	Darwin: TranslationKeys.scientist_fact_darwin,
	Franklin: TranslationKeys.scientist_fact_franklin,
	Turing: TranslationKeys.scientist_fact_turing,
	Johnson: TranslationKeys.scientist_fact_johnson,
	Tesla: TranslationKeys.scientist_fact_tesla,
	Galilei: TranslationKeys.scientist_fact_galilei,
	Meitner: TranslationKeys.scientist_fact_meitner,
	Noether: TranslationKeys.scientist_fact_noether,
	Hopper: TranslationKeys.scientist_fact_hopper,
	Hawking: TranslationKeys.scientist_fact_hawking,
	Feynman: TranslationKeys.scientist_fact_feynman,
	Planck: TranslationKeys.scientist_fact_planck,
	Humboldt: TranslationKeys.scientist_fact_humboldt,
	Gauss: TranslationKeys.scientist_fact_gauss,
	Mendel: TranslationKeys.scientist_fact_mendel,
	Goodall: TranslationKeys.scientist_fact_goodall,
	Jemison: TranslationKeys.scientist_fact_jemison,
	Wu: TranslationKeys.scientist_fact_wu,
	Ramanujan: TranslationKeys.scientist_fact_ramanujan,
	Youyou: TranslationKeys.scientist_fact_youyou,
	Haytham: TranslationKeys.scientist_fact_haytham,
	Hypatia: TranslationKeys.scientist_fact_hypatia,
	Carson: TranslationKeys.scientist_fact_carson,
	Hodgkin: TranslationKeys.scientist_fact_hodgkin,
	McClintock: TranslationKeys.scientist_fact_mcclintock,
	Carver: TranslationKeys.scientist_fact_carver,
	Bohr: TranslationKeys.scientist_fact_bohr,
	Lamarr: TranslationKeys.scientist_fact_lamarr,
	Kepler: TranslationKeys.scientist_fact_kepler,
	Maathai: TranslationKeys.scientist_fact_maathai,
	Kariko: TranslationKeys.scientist_fact_kariko,
	Mendeleev: TranslationKeys.scientist_fact_mendeleev,
	Mirzakhani: TranslationKeys.scientist_fact_mirzakhani,
};

export function getScientistFactKey(scientist: FamousScientist): TranslationKeys | null {
	return SCIENTIST_FACT_KEYS[scientist.nickname] ?? null;
}
