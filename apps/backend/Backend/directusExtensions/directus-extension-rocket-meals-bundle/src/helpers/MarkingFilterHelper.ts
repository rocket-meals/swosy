import { DatabaseTypes } from 'repo-depkit-common';

export type DictMarkingsExclusions = Record<string, DatabaseTypes.MarkingsExclusions>;

export type MarkingWithIdAndExclusionRulesOnly = {
  id: string;
  excluded_by_markings: string[] | DatabaseTypes.MarkingsExclusions[] | number[];
  [key: string]: any;
};

export class MarkingFilterHelper {
  static getDictMarkingsExclusions(markingsExclusions: DatabaseTypes.MarkingsExclusions[]): DictMarkingsExclusions {
    let dictMarkingsExclusions: DictMarkingsExclusions = {};
    for (let markingExclusion of markingsExclusions) {
      dictMarkingsExclusions[markingExclusion.id] = markingExclusion;
    }
    return dictMarkingsExclusions;
  }

  static filterMarkingByRestrictionRules<T extends MarkingWithIdAndExclusionRulesOnly>(markings: T[], dictMarkingsExclusions: DictMarkingsExclusions): T[] {
    // so we want to filter out all markings which have a restriction rule that is not fulfilled
    let filteredMarkings: T[] = [];
    let markingsDictPresent: Record<string, T> = MarkingFilterHelper.buildMarkingsPresentDict(markings); // create a dict for faster lookup which markings are present
    for (let marking_to_be_checked of markings) {
      // for each marking
      let markingExclusionRulesForMarkingIds = MarkingFilterHelper.getMarkingExclusionRuleIdsFromMarking(marking_to_be_checked); // get the exclusion rules for the marking
      let isMarkingAllowed = true; // we assume that the marking is allowed
      if (markingExclusionRulesForMarkingIds.length > 0) {
        // if there are exclusion rules for the marking
        isMarkingAllowed = !MarkingFilterHelper.isMarkingRestrictedByPresentMarking(markingExclusionRulesForMarkingIds, dictMarkingsExclusions, markingsDictPresent);
      }
      if (isMarkingAllowed) {
        // if the marking is allowed
        filteredMarkings.push(marking_to_be_checked); // add the marking to the filtered markings
      }
    }

    return filteredMarkings; // return the filtered markings
  }

  static buildMarkingsPresentDict<T extends MarkingWithIdAndExclusionRulesOnly>(markings: T[]): Record<string, T> {
    // create a dict for faster lookup which markings are present
    let markingsDictPresent: Record<string, T> = {};
    for (let marking of markings) {
      markingsDictPresent[marking.id] = marking;
    }
    return markingsDictPresent;
  }

  static isMarkingRestrictedByPresentMarking(
    markingExclusionRulesForMarkingIds: string[],
    dictMarkingsExclusions: DictMarkingsExclusions,
    markingsDictPresent: Record<string, MarkingWithIdAndExclusionRulesOnly>
  ): boolean {
    for (let markingExclusionRuleId of markingExclusionRulesForMarkingIds) {
      // for each exclusion rule
      let markingExclusionRule = dictMarkingsExclusions[markingExclusionRuleId]; // get the exclusion rule
      if (markingExclusionRule) {
        // if the exclusion rule exists
        let marking_being_restricted_by_id = markingExclusionRule.restricted_by_markings_id as string; // get the marking that is restricting the marking
        if (marking_being_restricted_by_id) {
          // if the marking that is restricting the marking exists
          let marking_being_restricted_found_in_present_markings = !!markingsDictPresent[marking_being_restricted_by_id]; // check if the marking that is restricting the marking is present in the present markings
          if (marking_being_restricted_found_in_present_markings) {
            // if the marking that is restricting the marking is present in the present markings
            return true; // the marking is not allowed
          }
        }
      }
    }
    return false; // no restriction found, the marking is allowed
  }

  static getMarkingExclusionRuleIdsFromMarking(marking: MarkingWithIdAndExclusionRulesOnly): string[] {
    // check what type the field excluded_by_markings is
    // if it is an array of strings, return it
    // if it is an array of objects, return the ids of the objects
    let markingExclusionRulesForMarking = marking.excluded_by_markings as any[] | DatabaseTypes.MarkingsExclusions[];
    const isArrayOfStringsOrNumbers = markingExclusionRulesForMarking.every(item => {
      return typeof item === 'string' || typeof item === 'number';
    });
    if (isArrayOfStringsOrNumbers) {
      return markingExclusionRulesForMarking as string[];
    } else {
      return markingExclusionRulesForMarking.map(item => item.id);
    }
  }
}
