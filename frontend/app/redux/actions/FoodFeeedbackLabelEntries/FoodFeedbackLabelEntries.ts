// import { ServerAPI } from '@/redux/actions/Auth/Auth'; // API client
// import { CollectionHelper } from '@/helper/collectionHelper'; // Reusing the CollectionHelper
// import { FoodsFeedbacks, FoodsFeedbacksLabels, FoodsFeedbacksLabelsEntries } from '@/constants/types';

// export class FoodFeedbackLabelEntryHelper extends CollectionHelper<any> {
//   constructor(client?: any) {
//     super('foods_feedbacks_labels_entries', client || ServerAPI.getClient());
//   }

//   // Fetch food feedback label entries with query overrides
//   async fetchFoodFeedbackLabelEntries(queryOverride: any = {}) {
//     const defaultQuery = {
//       filter: {
//         _and: [
//           { like: { _nnull: true } }, // Ensure 'like' is not null
//           { food: { _eq: '3183' } }, // Example food ID
//           { label: { _eq: 'e3abe9e2-e596-43b4-9c2f-12b9c5f29386' } }, // Example label ID
//         ]
//       },
//       aggregate: {
//         count: '*' // Count all entries
//       },
//       groupBy: 'like', // Group by 'like' field
//     };

//     const query = { ...defaultQuery, ...queryOverride };
//     return this.readItems(query);
//   }

//   // Fetch food feedback label entries by profile ID
//   async fetchFoodFeedbackLabelEntriesByProfile(profileId: string, queryOverride: any = {}) {
//     const defaultQuery = {
//       filter: {
//         _and: [
//           { profile: { _eq: profileId } }, // Filter by profile ID
//           { status: { _eq: 'published' } }
//         ]
//       },
//     };

//     const query = { ...defaultQuery, ...queryOverride };
//     return this.readItems(query);
//   }

//   // Fetch a specific food feedback label entry by ID
//   async fetchFoodFeedbackLabelEntryById(id: string, queryOverride: any = {}) {
//     const defaultQuery = {
//       fields: ['*'], // Adjust the fields as needed
//     };

//     const query = { ...defaultQuery, ...queryOverride };
//     return this.readItem(id, query);
//   }

//   // Helper to create or update food feedback label entry
//   private async createOrUpdateEntry(
//     foodId: string,
//     profileId: string,
//     foodFeedbackLabel: FoodsFeedbacksLabels,
//     like: boolean | null,
//     canteenId?: string,
//     foodofferId?: string
//   ): Promise<FoodsFeedbacksLabelsEntries> {
//     // Check for existing label entry
//     const existingEntry = await this.fetchFoodFeedbackLabelEntriesByProfile(profileId, {
//       filter: {
//         _and: [
//           { food: { _eq: foodId } },
//           { label: { _eq: foodFeedbackLabel.id } },
//         ]
//       }
//     }).then((entries: any) => entries[0]);

//     const labelData: Partial<FoodsFeedbacksLabelsEntries> = {
//       food: foodId,
//       label: foodFeedbackLabel.id,
//       like,
//       profile: profileId,
//       canteen: canteenId,
//       foodoffer: foodofferId
//     };

//     // If no existing entry, create a new one
//     if (!existingEntry) {
//       const newEntry = await this.createItem(labelData);
//       return newEntry as FoodsFeedbacksLabelsEntries;
//     }

//     // Update existing entry
//     existingEntry.like = like;

//     // Handle deletion if 'like' is null or undefined
//     if (like === null || like === undefined) {
//       await this.deleteItem(existingEntry.id);
//       return existingEntry;
//     }

//     // Otherwise, update the entry
//     await this.updateItem(existingEntry.id, existingEntry);
//     return existingEntry;
//   }

//   // Update or delete food feedback label entry based on conditions
//   async updateFoodFeedbackLabelEntry(
//     foodId: string,
//     profileId: string,
//     // foodFeedbackLabelEntriesData: FoodsFeedbacksLabelsEntries[] | null | undefined,
//     foodFeedbackLabel: FoodsFeedbacksLabels,
//     like: boolean | null,
//     canteenId?: string,
//     foodofferId?: string
//   ) {
//     try {
//       // Process the creation or update of the label entry
//       const updatedEntry = await this.createOrUpdateEntry(
//         foodId, 
//         profileId, 
//         foodFeedbackLabel, 
//         like, 
//         canteenId, 
//         foodofferId
//       );

//       console.log('Updated Entry:', updatedEntry);

//       // If the like is null, it will already be deleted, no further actions needed
//       if (like === null || like === undefined) return;

//       // Otherwise, update the entry
//       console.log('Updating entry with new data:', updatedEntry);
//     } catch (error) {
//       console.error('Error updating food feedback label entry:', error);
//     }
//   }

//   // Static method to query food feedback label entries with a custom query
//   public static async QueryData(data: any, query: any) {
//     return ServerAPI.getClient().request(query);
//   }
// }

import { ServerAPI } from '@/redux/actions/Auth/Auth'; // API client
import { CollectionHelper } from '@/helper/collectionHelper'; // Reusing the CollectionHelper
import { FoodsFeedbacks, FoodsFeedbacksLabels, FoodsFeedbacksLabelsEntries } from '@/constants/types';

export class FoodFeedbackLabelEntryHelper extends CollectionHelper<any> {
  constructor(client?: any) {
    super('foods_feedbacks_labels_entries', client || ServerAPI.getClient());
  }

  // Helper to build default query
  private buildQuery(queryOverride: any, defaultQuery: any) {
    return { ...defaultQuery, ...queryOverride };
  }

  // Fetch food feedback label entries with query overrides
  async fetchFoodFeedbackLabelEntries(queryOverride: any = {}) {
    const defaultQuery = {
      filter: {
        _and: [
          { like: { _nnull: true } }, // Ensure 'like' is not null
          { food: { _eq: '3183' } }, // Example food ID
          { label: { _eq: 'e3abe9e2-e596-43b4-9c2f-12b9c5f29386' } } // Example label ID
        ]
      },
      aggregate: { count: '*' },
      groupBy: 'like'
    };
    return await this.readItems(this.buildQuery(queryOverride, defaultQuery));
  }

  // Fetch food feedback label entries by profile
  async fetchFoodFeedbackLabelEntriesByProfile(profileId: string, queryOverride: any = {}) {
    const defaultQuery = {
      filter: {
        _and: [
          { profile: { _eq: profileId } },
          { status: { _eq: 'published' } }
        ]
      }
    };
    return await this.readItems(this.buildQuery(queryOverride, defaultQuery));
  }

  // Fetch a specific food feedback label entry by ID
  async fetchFoodFeedbackLabelEntryById(id: string, queryOverride: any = {}) {
    const defaultQuery = { fields: ['*'] };
    return await this.readItem(id, this.buildQuery(queryOverride, defaultQuery));
  }

  // Update or create food feedback label entry
  async updateFoodFeedbackLabelEntry(
    foodId: string,
    profile_id: string,
    foodFeedbackLabelEntriesData: FoodsFeedbacksLabelsEntries[] | null | undefined,
    foodFeedbackLabelId: string,
    like: boolean | null,
    canteen_id: string | null | undefined,
    foodoffer_id: string | null | undefined
  ) {
    // Default to empty array if no entries provided
    let foodFeedbackLabelEntries = foodFeedbackLabelEntriesData ?? [];

    // Check for existing entry
    let existingEntry = foodFeedbackLabelEntries?.find(
      (x) => x.label === foodFeedbackLabelId && x.food === foodId
    );
    let isNewEntry = !existingEntry;

    // Prepare new entry data
    const newFoodFeedbackLabelEntry: Partial<FoodsFeedbacksLabelsEntries> = {
      food: foodId,
      label: foodFeedbackLabelId,
      like,
      profile: profile_id,
    };

    // Create a new entry if not found
    if (isNewEntry) {
      existingEntry = await this.createItem(newFoodFeedbackLabelEntry) as FoodsFeedbacksLabelsEntries;
    }

    // Handle missing entry
    if (!existingEntry) {
      console.error('updateFoodFeedbackRemote: existingFoodFeedbackLabelEntry is undefined');
      return;
    }

    // Update entry fields
    existingEntry.like = like;
    if (canteen_id) existingEntry.canteen = canteen_id;
    if (foodoffer_id) existingEntry.foodoffer = foodoffer_id;

    // If 'like' is null or undefined, delete the entry
    const shouldDelete = existingEntry.like === null || existingEntry.like === undefined;
    if (shouldDelete && existingEntry.id) {
      await this.deleteItem(existingEntry.id);
      return null;
    } else {
      // Update the entry
      return await this.updateItem(existingEntry.id, existingEntry);
    }
  }

  // Create a new food feedback label entry
  async createFoodFeedbackLabelEntry(entryData: any) {
    return await this.createItem(entryData);
  }

  // Update an existing food feedback label entry
  async updateFoodFeedbackLabelEntryById(id: string, updatedData: any) {
    return await this.updateItem(id, updatedData);
  }

  // Delete a food feedback label entry
  async deleteFoodFeedbackLabelEntry(id: string) {
    return await this.deleteItem(id);
  }

  // Fetch a single food feedback label entry directly by ID
  async itemFoodFeedbackLabelEntry(id: string) {
    return await this.readItem(id);
  }

  // Static method to query food feedback label entries with a custom query
  public static async QueryData(data: any, query: any) {
    return await ServerAPI.getClient().request(query);
  }
}

