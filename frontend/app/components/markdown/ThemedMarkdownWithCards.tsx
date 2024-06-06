import React, {FunctionComponent, useState} from 'react';
import RenderHtml from 'react-native-render-html';
import {Icon, Text, getFontSizeInPixelBySize, View, useViewBackgroundColor} from '@/components/Themed';
import {TouchableOpacity, useWindowDimensions} from 'react-native';
import {useTextContrastColor} from '@/components/Themed';
import MarkdownIt from 'markdown-it';
import {IconNames} from "@/constants/IconNames";
import {replaceLinebreaks, ThemedMarkdown} from "@/components/markdown/ThemedMarkdown";
import {useLighterOrDarkerColorForSelection} from "@/helper/color/MyContrastColor";
import {useProjectColor, useProjectColorContrast} from "@/states/ProjectInfo";

interface AppState {
	darkmode?: boolean,
	hideSkeleton?: boolean,
	debug?: boolean,
	markdown?: string,
	color?: string,
	children?: string
}

const CollapsibleCard: FunctionComponent<{ titleSource: string, children: React.ReactNode, initiallyOpen: boolean }> = ({titleSource, initiallyOpen, children}) => {
	const [collapsed, setCollapsed] = useState(!initiallyOpen);
	const toggleCollapse = () => setCollapsed(!collapsed);

	const projectColor = useProjectColor()
	const projectContrastColor = useProjectColorContrast()

	return (
		<View style={{marginVertical: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8}}>
			<TouchableOpacity onPress={toggleCollapse} style={{padding: 10, backgroundColor: projectColor, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
				<ThemedMarkdown markdown={titleSource} color={projectContrastColor} />
				<Icon name={collapsed ? IconNames.expand_icon : IconNames.collapse_icon} color={projectContrastColor} />
			</TouchableOpacity>
			{!collapsed && <View style={{padding: 10}}>{children}</View>}
		</View>
	);
};

type TokenOrSection = { token: any, section: { titleTokens: any[], contentTokenOrSections: TokenOrSection[] } | undefined };

const extractTokenOrSections = (md: MarkdownIt, content: string): TokenOrSection[] => {
	let tokens = md.parse(content, {});
	let tokenOrSections = extractSectionsFromTokens(tokens, 1);
	return tokenOrSections
};


const extractSectionsFromTokens = (tokens: any[], level: number): TokenOrSection[] => {
	/**
	 * Structure: TokenOrSection[] =
	 * [
	 *     {
	 *         token: token
	 *     },
	 *     {
	 *         section: {
	 *         		titleTokens: [],
	 *         		contentTokenOrSections: [],
	 *         }
	 *     }
	 * ]
	 */
	let result: TokenOrSection[] = [];
	let titleTokens = [];
	let contentTokensToBeExtracted = [];
	let headingOpen = false;
	let anyHeaderFound = false;

	for(let i = 0; i < tokens.length; i++) {
		let token = tokens[i];
		if (token.type === 'heading_open' && token.tag === 'h' + level) {
			if(anyHeaderFound){
				// close previous section and push it to result
				result.push({
					token: undefined,
					section: {
						titleTokens: titleTokens,
						contentTokenOrSections: extractSectionsFromTokens(contentTokensToBeExtracted, level + 1)
					}
				});
			} else {
				anyHeaderFound = true;
			}

			headingOpen = true;

			titleTokens = [];
			contentTokensToBeExtracted = [];

			titleTokens.push(token);
		} else{
			if(!anyHeaderFound) {
				result.push({
					token: token,
					section: undefined
				});
			} else {
				if(headingOpen) {
					if(token.type === 'heading_close' && token.tag === 'h' + level) {
						headingOpen = false;
					}
					titleTokens.push(token);
				} else {
					contentTokensToBeExtracted.push(token);
				}
			}
		}
	}

	if(!anyHeaderFound) {
		for(let i = 0; i < tokens.length; i++) {
			result.push({
				token: tokens[i],
				section: undefined
			});
		}
	} else {
		// close last section and push it to result
		result.push({
			token: undefined,
			section: {
				titleTokens: titleTokens,
				contentTokenOrSections: extractSectionsFromTokens(contentTokensToBeExtracted, level + 1)
			}
		});
	}

	return result;
};

const getSourceFromTokens = (tokens: any[] | undefined): string => {
	let source = "";
	if(!!tokens) {
		for(let i = 0; i < tokens.length; i++) {
			let token = tokens[i];
			if(token) {
				// if tag is p, br opening then add \n
				if(token.tag === 'p' || token.tag === 'br') {
					source += '\n';
				}
				source += token.content;
				// if tag is p, br closing then add \n
				if(token.tag === 'p' || token.tag === 'br') {
					source += '\n';
				}
				//source+= ' (((' + token.type + '))) ';
			}
		}
	}
	return source;
}


const renderTokenOrSections = (tokenOrSections: TokenOrSection[], width: number, defaultTextProps: any, initiallyOpenWhenOnlyOneSection: boolean) => {
	let output = [];
	let lastTokens = [];
	let sectionCount = 0;
	for(let i = 0; i < tokenOrSections.length; i++) {
		let tokenOrSection = tokenOrSections[i];
		if(tokenOrSection.section) {
			sectionCount++;
		}
	}
	let firstSection = true;
	let moreThanOneSection = sectionCount > 1;

	for(let i = 0; i < tokenOrSections.length; i++) {
		let tokenOrSection = tokenOrSections[i];
		if(tokenOrSection.token) {
			lastTokens.push(tokenOrSection.token);
		} else {
			// render last tokens
			if(lastTokens.length > 0) {
				let source = getSourceFromTokens(lastTokens);

				output.push(
					<ThemedMarkdown key={i} markdown={source} />
				);
				lastTokens = [];
			}

			let titleSource: string = tokenOrSection.section?.titleTokens.map((token: any) => token.content).join('') || '';

			let initiallyOpenForThisSection = initiallyOpenWhenOnlyOneSection && firstSection && !moreThanOneSection;
			let subSectionsInitialOpen = false

			output.push(
				<CollapsibleCard key={i} titleSource={titleSource} initiallyOpen={initiallyOpenForThisSection}>
					{renderTokenOrSections(tokenOrSection.section?.contentTokenOrSections || [], width, defaultTextProps, subSectionsInitialOpen)}
				</CollapsibleCard>
			);

			firstSection = false;
		}
	}

	// render last tokens
	if(lastTokens.length > 0) {
		let source = getSourceFromTokens(lastTokens);

		output.push(
			<ThemedMarkdown key={tokenOrSections.length} markdown={source} />
		);
		//lastTokens = [];
	}

	return output;
};

export const ThemedMarkdownWithCards: FunctionComponent<AppState> = (props) => {
	let sourceContent: string = props?.markdown || props.children as string;
	const themedTextColor = useTextContrastColor();
	const textColor = props?.color || themedTextColor;

	if (sourceContent === undefined && !props.hideSkeleton) {
		return <Text>{'Loading'}</Text>
	}

	const md = new MarkdownIt();
	sourceContent = replaceLinebreaks(sourceContent);
	const tokenOrSections = extractTokenOrSections(md, sourceContent);

	const {width} = useWindowDimensions();
	const fontSize = getFontSizeInPixelBySize('md');

	const defaultTextProps = {
		selectable: true,
		color: textColor,
		fontSize: fontSize + 'px',
		fontStyle: 'normal',
	};

	if (props?.debug) {
		return (
			<Text selectable={true}>
				{JSON.stringify(tokenOrSections, null, 2)}
			</Text>
		)
	} else {
		return (
			<View>
				{renderTokenOrSections(tokenOrSections, width, defaultTextProps, true)}
			</View>
		)
	}
}
