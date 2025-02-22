import { Project, TypeAliasDeclaration } from "ts-morph";
import { resolve } from "path";
import { CollectionNames } from "../helpers/CollectionNames";

const pathToDatabaseTypes = resolve(__dirname, "./types.ts");

// Initialize a ts-morph project
const project = new Project();

// Add the source file containing the FormAnswers type
const sourceFile = project.addSourceFileAtPath(pathToDatabaseTypes);

/**
 * @deprecated Do not use in production code. Only for jest tests.
 * @param collection: CollectionNames
 */
export function getCollectionTypeAlias(collection: CollectionNames) {
    // Example "form_answers" (directus collection name) -> "FormAnswers" (type alias name)
    let collectionTransposed = collection.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("");
    return sourceFile.getTypeAlias(collectionTransposed);
}

/**
 * @deprecated Do not use in production code. Only for jest tests.
 * @param collection: CollectionNames
 */
export function getCollectionPropertyDetails(collection: CollectionNames) {
    // Transform the collection name to the type alias name
    // From "form_answers" to "FormAnswers"
    const collectionTypeAlias = getCollectionTypeAlias(collection);
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

/**
 * @deprecated Do not use in production code. Only for jest tests.
 * @param collection: CollectionNames
 */
export function getCollectionPropertyNames(collection: CollectionNames) {
    return getCollectionPropertyDetails(collection).map(property => property.name);
}