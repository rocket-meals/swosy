import type { LegalDocumentText } from '../../LegalDocuments';

export const IMPRINT_FR: LegalDocumentText = {
  title: 'À propos de nous',
  content: `# Mentions légales

Les informations suivantes contiennent les données obligatoires prévues par la loi pour l'identification des fournisseurs ainsi que des informations juridiques sur la présence Internet et l'application.

## Éditeur :
	
	{{operator.name}}
	{{operator.street}},
	{{operator.postal_code}} {{operator.city}}
	Tél. : {{operator.phone}}
	Courrier électronique : {{operator.email}}
	Gérant : {{operator.managing_director}}
	Numéro d'identification fiscale : {{operator.tax_number}}
	Numéro d'identification de la taxe sur le chiffre d'affaires : {{operator.vat_id}}
	Registre du commerce : Amtsgericht {{operator.register_court}}, {{operator.register_number}}
	
	Courrier électronique :

	[{{operator.email}}](mailto:{{operator.email}})

	Site web :

	[{{operator.website}}]({{operator.website}})

## Possibilités de contact
	Vous pouvez nous contacter par mail ou via notre site web.

	Courrier électronique :

	[{{operator.email}}](mailto:{{operator.email}})

	Site web :

	[{{operator.website}}]({{operator.website}})

## Conception et réalisation technique
	{{operator.name}}
	
	[{{operator.email}}](mailto:{{operator.email}})
	
	[{{operator.website}}]({{operator.website}})


## Responsable du contenu journalistique et éditorial :

	{{customer.name}}
	{{customer.legal_form}}
	Tél. {{customer.phone}}

	[{{customer.email}}](mailto:{{customer.email}})

    Le Studierendenwerk est responsable de la mise à disposition des images, des plats, des offres de repas, des marquages et des icônes pour les allergènes, ainsi que des marquages. En outre, il est responsable des informations et des droits sur les images pour les appartements et les actualités.


## Clause de non-responsabilité

	### Contenu de l'offre en ligne

		{{operator.short_name}}, en tant qu'exploitant de cette application et de ce site Internet, n'assume aucune garantie quant à l'actualité, l'exactitude, l'exhaustivité ou la qualité des informations mises à disposition. {{operator.short_name}} décline toute responsabilité en cas de dommages matériels ou immatériels causés par l'utilisation ou la non-utilisation des informations présentées ou par l'utilisation d'informations erronées ou incomplètes, dans la mesure où il n'est pas prouvé que {{operator.short_name}} a commis une faute intentionnelle ou une négligence grave. Toutes les offres sont sans engagement et non contractuelles. {{operator.short_name}} se réserve expressément le droit de modifier, de compléter ou de supprimer des parties de pages ou l'ensemble de l'offre sans avis préalable, ou d'en suspendre temporairement ou définitivement la publication.

	### Références et liens

		En cas de renvois directs ou indirects à des pages Internet externes ("liens") qui ne relèvent pas de la responsabilité de l'exploitant, une obligation de responsabilité entrerait exclusivement en vigueur dans le cas où l'exploitant aurait connaissance des contenus et qu'il lui serait techniquement possible et raisonnable d'empêcher l'utilisation en cas de contenus illégaux.

		{{operator.short_name}} déclare donc expressément qu'au moment de l'établissement des liens, les pages correspondantes étaient exemptes de contenus illégaux. L'exploitant n'a aucune influence sur la conception actuelle et future et sur les contenus des pages liées/associées. C'est pourquoi il se distancie expressément par la présente de tous les contenus de toutes les pages liées/associées qui ont été modifiées après l'établissement des liens. Cette constatation s'applique à tous les liens et renvois placés dans la propre offre Internet ainsi qu'aux inscriptions de tiers dans les livres d'or, forums de discussion et listes de diffusion mis en place par {{operator.short_name}}. Seul le fournisseur de la page à laquelle il a été renvoyé est responsable des contenus illégaux, erronés ou incomplets et en particulier des dommages résultant de l'utilisation ou de la non-utilisation des informations ainsi présentées, et non celui qui ne fait que renvoyer à la publication concernée par le biais de liens.

	### Droit d'auteur et droit des marques

		La mise en page de l'application et de la page d'accueil, les graphiques utilisés ainsi que les autres contenus sont protégés par des droits d'auteur. La reproduction d'informations et de données, en particulier l'utilisation de parties de textes ou d'images, nécessite l'accord écrit préalable de {{operator.short_name}}. L'utilisateur ne peut utiliser les contenus que dans le cadre des fonctionnalités proposées pour son usage personnel. Il n'acquiert aucun droit sur les contenus ou les programmes. Si des logiciels sont proposés au téléchargement, le droit d'utilisation de l'utilisateur se limite à une utilisation personnelle dans le cadre de l'utilisation du site Internet.

		{{operator.short_name}} s'efforce de respecter dans toutes les publications les droits d'auteur des graphiques, documents sonores, séquences vidéo et textes utilisés, d'utiliser des graphiques, documents sonores, séquences vidéo et textes qu'il a lui-même créés ou de recourir à des graphiques, documents sonores, séquences vidéo et textes libres de droits. Toutes les marques et marques déposées mentionnées dans l'offre Internet et éventuellement protégées par des tiers sont soumises sans restriction aux dispositions du droit des marques de fabrique en vigueur et aux droits de propriété des propriétaires enregistrés respectifs. La simple mention d'une marque ne permet pas d'en déduire qu'elle n'est pas protégée par les droits d'un tiers ! Le copyright des objets publiés et créés par l'exploitant lui-même reste la propriété exclusive de l'exploitant des pages. Toute reproduction ou utilisation de tels graphiques, documents sonores, séquences vidéo et textes dans d'autres publications électroniques ou imprimées est interdite sans l'autorisation expresse de l'exploitant.
		
		
	### Protection des données

		Dans la mesure où l'application et l'offre Internet offrent la possibilité de saisir des données personnelles ou professionnelles (adresses e-mail, noms, adresses), la divulgation de ces données par l'utilisateur se fait sur une base expressément volontaire. L'utilisation et le paiement de tous les services proposés sont également autorisés - dans la mesure où cela est techniquement possible et raisonnable - sans indication de telles données ou en indiquant des données anonymes ou un pseudonyme.
		
		
	### Validité juridique de cette clause de non-responsabilité

		Si des parties ou certaines formulations de ce texte ne devaient pas, plus ou pas entièrement correspondre à la situation juridique en vigueur, les autres parties du document n'en seraient pas affectées dans leur contenu et leur validité.`,
};
