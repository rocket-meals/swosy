import type { LegalDocumentText } from '../../LegalDocuments';

export const IMPRINT_ES: LegalDocumentText = {
  title: 'Quiénes somos',
  content: `# Pie de imprenta

La siguiente información contiene la información legalmente requerida sobre el etiquetado del proveedor, así como información legal sobre el sitio web y la aplicación.

## Editor:
	
	{{operator.name}}
	{{operator.street}},
	{{operator.postal_code}} {{operator.city}}
	Teléfono: {{operator.phone}}
	Correo electrónico: {{operator.email}}
	Director general: {{operator.managing_director}}
	Número de identificación fiscal: {{operator.tax_number}}
	Número de identificación fiscal: {{operator.vat_id}}
	Registro mercantil: Amtsgericht {{operator.register_court}}, {{operator.register_number}}
	
	Correo electrónico:

	[{{operator.email}}](mailto:{{operator.email}})

	Página web:

	[{{operator.website}}]({{operator.website}})

## Opciones de contacto
	Puede ponerse en contacto con nosotros por correo electrónico o a través de nuestro sitio web.

	Correo electrónico:

	[{{operator.email}}](mailto:{{operator.email}})

	Página web:

	[{{operator.website}}]({{operator.website}})

## Diseño y realización técnica
	{{operator.name}}
	
	[{{operator.email}}](mailto:{{operator.email}})
	
	[{{operator.website}}]({{operator.website}})


## Responsable del contenido periodístico-editorial:

	{{customer.name}}
	{{customer.legal_form}}
	Tel. {{customer.phone}}

	[{{customer.email}}](mailto:{{customer.email}})

    El Studierendenwerk es responsable de proporcionar las imágenes, las comidas, las ofertas de alimentos, el etiquetado y los iconos de alérgenos, así como el etiquetado. También es responsable de la información y los derechos de las imágenes para los pisos y las noticias.


## Descargo de responsabilidad

	### Contenido de la oferta online

		{{operator.short_name}}, como operador de esta aplicación y sitio web, no asume ninguna responsabilidad por la actualidad, exactitud, integridad o calidad de la información proporcionada. Las reclamaciones de responsabilidad contra {{operator.short_name}} relativas a daños materiales o inmateriales causados por el uso o no uso de la información proporcionada o por el uso de información incorrecta o incompleta quedan fundamentalmente excluidas, a menos que se pueda demostrar que {{operator.short_name}} ha actuado con dolo o negligencia grave. Todas las ofertas son sin compromiso y no vinculantes. {{operator.short_name}} se reserva expresamente el derecho a modificar, completar o eliminar partes de las páginas o la oferta completa sin previo aviso o a interrumpir la publicación temporal o definitivamente.

	### Referencias y enlaces

		En el caso de referencias directas o indirectas a páginas web externas ("enlaces") que se encuentren fuera del ámbito de responsabilidad del operador, sólo entraría en vigor una obligación de responsabilidad en el caso de que el operador tuviera conocimiento de los contenidos y le fuera técnicamente posible y razonable impedir el uso en caso de contenidos ilegales.

		Por ello, {{operator.short_name}} declara expresamente que las páginas enlazadas estaban libres de contenidos ilegales en el momento en que se crearon los enlaces. El operador no tiene influencia alguna sobre el diseño y los contenidos actuales y futuros de las páginas enlazadas. Por lo tanto, el operador se distancia expresamente de todos los contenidos de todas las páginas enlazadas que se hayan modificado después de crear el enlace. Esta declaración se aplica a todos los enlaces y referencias establecidos dentro del propio sitio web de {{operator.short_name}}, así como a las entradas de terceros en los libros de visitas, foros de discusión y listas de correo creados por {{operator.short_name}}. De los contenidos ilegales, incorrectos o incompletos y, en particular, de los daños derivados de la utilización o no utilización de dicha información, sólo será responsable el proveedor de la página a la que se haga referencia, y no la persona que se limite a remitir a la publicación correspondiente a través de enlaces.

	### Derechos de autor y etiquetado

		El diseño de la aplicación y de la página de inicio, los gráficos utilizados y el resto del contenido están protegidos por derechos de autor. La reproducción de información y datos, en particular el uso de partes de textos o imágenes, requiere el consentimiento previo por escrito de {{operator.short_name}}. El usuario sólo podrá utilizar el contenido para su uso personal dentro del ámbito de las funcionalidades ofrecidas. No adquiere ningún derecho sobre el contenido o los programas. Si se ofrece software para descargar, la autorización de uso del usuario se limita al uso personal dentro del ámbito de utilización del sitio web.

		{{operator.short_name}} se esfuerza por respetar los derechos de autor de los gráficos, documentos sonoros, secuencias de vídeo y textos utilizados en todas las publicaciones, por utilizar gráficos, documentos sonoros, secuencias de vídeo y textos creados por ella misma o por hacer uso de gráficos, documentos sonoros, secuencias de vídeo y textos libres de licencia. Todas las marcas y marcas comerciales mencionadas en el sitio web y eventualmente protegidas por terceros están sujetas sin restricciones a las disposiciones del derecho de marcas aplicable y a los derechos de propiedad de los respectivos propietarios registrados. La mera mención de una marca no implica que no esté protegida por derechos de terceros. Los derechos de autor de los objetos publicados y creados por el propio operador de las páginas corresponden exclusivamente al operador de las mismas. La reproducción o utilización de tales gráficos, documentos sonoros, secuencias de vídeo y textos en otras publicaciones electrónicas o impresas no está permitida sin el consentimiento expreso del operador.
		
		
	### Protección de datos

		Si la aplicación y el sitio web ofrecen la posibilidad de introducir datos personales o comerciales (direcciones de correo electrónico, nombres, direcciones), la revelación de estos datos por parte del usuario es expresamente voluntaria. El uso y el pago de todos los servicios ofrecidos también está permitido -en la medida en que sea técnicamente posible y razonable- sin proporcionar dichos datos o proporcionando datos anónimos o un seudónimo.
		
		
	### Validez jurídica de este aviso legal

		Si algunas secciones o términos individuales de esta declaración no son legales o correctos, el contenido o la validez de las otras partes no se verán afectados por este hecho.`,
};
