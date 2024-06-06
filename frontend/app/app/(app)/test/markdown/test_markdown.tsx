import {Heading, View} from '@/components/Themed';
import {ThemedMarkdown} from '@/components/markdown/ThemedMarkdown';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {SettingsRowTextEdit} from '@/components/settings/SettingsRowTextEdit';
import {useState} from 'react';

export const realisticMarkdownTest = `
# Psychologische und Sozialberatung

![Alt text for image](https://via.placeholder.com/320)

Wenn Probleme und persönliche Schwierigkeiten im Studienalltag zur Belastung werden, hilft undere Beratungsstelle.

[Mehr informationen](https://www.google.com)

## Psychologische Beratung

![Alt text for image](https://via.placeholder.com/320)

Wenn du in einer schwierigen Lebenssituation steckst, kann eine psychologische Beratung helfen. Unsere Psychologinnen und Psychologen unterstützen dich dabei, deine Probleme zu erkennen und Lösungen zu finden.

Tel: [123 456 789](tel:123456789)

E-Mail: [beratung@universität.de](mailto:beratung@universität.de)

[Mehr informationen](https://www.google.com)

## Sozialberatung

![Alt text for image](https://via.placeholder.com/320)

Die Sozialberatung unterstützt dich bei Fragen zu Studienfinanzierung, Wohnen, Sozialleistungen und vielem mehr.

Tel: [123 456 789](tel:123456789)

E-Mail: [beratung@universität.de](mailto:beratung@universität.de)

[Mehr informationen](https://www.google.com)

## Hilfe in akuten Krisen

![Alt text for image](https://via.placeholder.com/320)

Wenn du dich in einer akuten Krise befindest, kannst du dich an die folgenden Stellen wenden:
- Notruf [112](tel:112)
- Telefonseelsorge [0800 111 0 111](tel:08001110111)
- Krisendienst Psychiatrie [123 456 789](tel:123456789)

[Mehr informationen](https://www.google.com)
`


export const extensiveMarkdownTest = `
# Markdown Test Document

## Headers
# H1 Header
## H2 Header
### H3 Header
#### H4 Header
##### H5 Header
###### H6 Header

## Text Styles
*Italic text* or _Italic text_

**Bold text** or __Bold text__

***Bold and italic*** or ___Bold and italic___

~~Strikethrough text~~

## Lists

### Unordered Lists
- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2
- Item 3

### Ordered Lists
1. First item
2. Second item
   1. Subitem 2.1
   2. Subitem 2.2
3. Third item

## Links
[OpenAI](https://www.openai.com)

## Images
![Alt text for image](https://via.placeholder.com/150)

## Code
Inline code: \`print("Hello, World!")\`

### Code Block
\`\`\`python
def hello_world():
    print("Hello, World!")
\`\`\`
    `


export default function ScreenMarkdownTest() {
	const [mardkown, setMarkdown] = useState<string | undefined>(extensiveMarkdownTest)

	return (
		<View
			style={{
				width: '100%',
				height: '100%',
			}}
		>
			<View style={{
				width: '100%',
				paddingBottom: 10,
			}}
			>
				<Heading>{'Parameters'}</Heading>
				<SettingsRowTextEdit
					value={mardkown}
					labelRight={'Edit Markdown'}
					leftIcon={'text'}
					accessibilityLabel={'Edit Markdown'}
					labelLeft={'Edit Markdown'}
					onSave={
						(value) => {
							if (value) {
								setMarkdown(value)
							} else {
								setMarkdown(undefined)
							}
						}
					}
				/>
			</View>
			<View style={{
				width: '100%',
				height: '100%',
				flex: 1,
			}}
			>
				<MyScrollView>
					<ThemedMarkdown>
						{mardkown}
					</ThemedMarkdown>
				</MyScrollView>
			</View>
		</View>
	);
}