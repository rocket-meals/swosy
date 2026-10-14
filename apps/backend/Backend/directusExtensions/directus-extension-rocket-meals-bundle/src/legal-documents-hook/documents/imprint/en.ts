import type { LegalDocumentText } from '../../LegalDocumentTypes';

export const IMPRINT_EN: LegalDocumentText = {
  title: 'About us',
  content: `# Imprint

The following information contains the legally required information on provider identification as well as legal information on the website and app.

## Publisher:
	
	{{operator.name}}
	{{operator.street}},
	{{operator.postal_code}} {{operator.city}}
	Phone: {{operator.phone}}
	E-Mail: {{operator.email}}
	Managing director: {{operator.managing_director}}
	Tax number: {{operator.tax_number}}
	Sales tax identification number: {{operator.vat_id}}
	
	E-Mail:

	[{{operator.email}}](mailto:{{operator.email}})

	Website:

	[{{operator.website}}]({{operator.website}})

## Contact options
	You can contact us by e-mail or via our website.

	e-mail:

	[{{operator.email}}](mailto:{{operator.email}})

	Website:

	[{{operator.website}}]({{operator.website}})

## Design and technical implementation
	{{operator.name}}
	
	[{{operator.email}}](mailto:{{operator.email}})
	
	[{{operator.website}}]({{operator.website}})


## Responsible for journalistic-editorial content:

	{{customer.name}}
	{{customer.legal_form}}
	Tel. {{customer.phone}}

	[{{customer.email}}](mailto:{{customer.email}})

    The Studierendenwerk is responsible for providing the images, meals, food offers, labels and icons for allergens, as well as the labels. It is also responsible for the information and the rights to the images for the apartments and news.


## Disclaimer

	### Content of the online offer

		{{operator.short_name}} as the operator of this app and website assumes no liability for the topicality, correctness, completeness or quality of the information provided. Liability claims against {{operator.short_name}} relating to material or immaterial damage caused by the use or non-use of the information provided or by the use of incorrect or incomplete information are fundamentally excluded, unless {{operator.short_name}} can be proven to have acted with intent or gross negligence. All offers are subject to change and non-binding. {{operator.short_name}} expressly reserves the right to change, supplement or delete parts of the pages or the entire offer without prior notice or to cease publication temporarily or permanently.

	### References and links

		In the case of direct or indirect references to external websites ("links") that lie outside the area of responsibility of the operator, a liability obligation would only come into force in the event that the operator is aware of the content and it would be technically possible and reasonable for him to prevent use in the event of illegal content.

		{{operator.short_name}} therefore expressly declares that the linked pages were free of illegal content at the time the links were created. The operator has no influence whatsoever on the current and future design and content of the linked pages. Therefore, the operator hereby expressly distances itself from all content of all linked pages that were changed after the link was created. This statement applies to all links and references set within {{operator.short_name}}'s own website as well as to third-party entries in guest books, discussion forums and mailing lists set up by {{operator.short_name}}. For illegal, incorrect or incomplete contents and in particular for damages resulting from the use or non-use of such information, only the provider of the page to which reference is made is liable, not the person who merely refers to the respective publication via links.

	### Copyright and trademark law

		The layout of the app and homepage, the graphics used and the other content are protected by copyright. The reproduction of information and data, in particular the use of parts of text or images, requires the prior written consent of {{operator.short_name}}. The user may only use the content for his personal use within the scope of the functionalities offered. He does not acquire any rights to the content or programs. If software is offered for download, the user's right of use is limited to personal use within the scope of using the website.

		{{operator.short_name}} endeavors to observe the copyrights of the graphics, sound documents, video sequences and texts used in all publications, to use graphics, sound documents, video sequences and texts created by itself or to use license-free graphics, sound documents, video sequences and texts. All brands and trademarks mentioned on the website and possibly protected by third parties are subject without restriction to the provisions of the applicable trademark law and the ownership rights of the respective registered owners. The mere mention of a trademark does not imply that it is not protected by third-party rights! The copyright for published objects created by the operator himself remains solely with the operator of the pages. Reproduction or use of such graphics, sound documents, video sequences and texts in other electronic or printed publications is not permitted without the express consent of the operator.
		
		
	### Data protection

		If the app and the website offer the possibility to enter personal or business data (e-mail addresses, names, addresses), the disclosure of this data by the user is expressly voluntary. The use of and payment for all services offered is - insofar as technically possible and reasonable - also permitted without providing such data or by providing anonymized data or a pseudonym.
		
		
	### Legal validity of this disclaimer

		If sections or individual terms of this statement are not legal or correct, the content or validity of the other parts remain uninfluenced by this fact.`,
};
