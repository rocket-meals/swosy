import { Project } from 'ts-morph';
import { resolve } from 'node:path';
import { CollectionNames } from 'repo-depkit-common';

const pathToCommon = require.resolve('repo-depkit-common');
const pathToDatabaseTypes = resolve(pathToCommon, '..', 'src', 'databaseTypes', 'types.ts');

// Initialize a ts-morph project
const project = new Project();

// Add the source file containing the FormAnswers type
const sourceFile = project.addSourceFileAtPath(pathToDatabaseTypes);

// Non-deprecated implementations backing the @deprecated public API below, so that
// one @deprecated method calling another doesn't trigger "usage of deprecated API"
// warnings for what is really just internal implementation sharing.
function resolveCollectionTypeAlias(collection: CollectionNames) {
  // Example "form_answers" (directus collection name) -> "FormAnswers" (type alias name)
  let collectionTransposed = collection
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  return sourceFile.getTypeAlias(collectionTransposed);
}

function resolveCollectionPropertyDetails(collection: CollectionNames) {
  // Transform the collection name to the type alias name
  // From "form_answers" to "FormAnswers"
  const collectionTypeAlias = resolveCollectionTypeAlias(collection);
  if (!collectionTypeAlias) {
    throw new Error(`Type alias ${collection} not found in ${pathToDatabaseTypes}`);
  }

  // Extract properties from the type alias
  const type = collectionTypeAlias.getType();
  const properties = type.getProperties();

  // Extract meaningful data from the properties
  const propertyDetails = properties.map(property => {
    return {
      name: property.getName(),
      type: property.getTypeAtLocation(sourceFile).getText(),
    };
  });

  return propertyDetails;
}

export class CollectionHelper {
  /**
   * @deprecated Do not use in production code. Only for jest tests.
   * @param collection: CollectionNames
   */
  static getCollectionTypeAlias(collection: CollectionNames) {
    return resolveCollectionTypeAlias(collection);
  }

  /**
   * @deprecated Do not use in production code. Only for jest tests.
   * @param collection: CollectionNames
   */
  static getCollectionPropertyDetails(collection: CollectionNames) {
    return resolveCollectionPropertyDetails(collection);
  }

  /**
   * @deprecated Do not use in production code. Only for jest tests.
   * @param collection: CollectionNames
   */
  static getCollectionPropertyNames(collection: CollectionNames) {
    return resolveCollectionPropertyDetails(collection).map(property => property.name);
  }
}
