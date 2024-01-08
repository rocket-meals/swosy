import React, {FunctionComponent} from "react";
import {Button, Divider, Text, Tooltip, View} from "native-base";
import {Icon} from "../../../../kitcheningredients";
import {TouchableOpacity} from "react-native";
import {ViewPixelRatio} from "../../../helper/ViewPixelRatio";
import {DefaultComponentCard} from "../../../components/detailsComponent/DefaultComponentCard";
import {ImageOverlayPosition, ImageOverlays} from "../../../components/imageOverlays/ImageOverlays";
import {ImageOverlayCustom} from "../../../components/imageOverlays/ImageOverlayCustom";

export const VoiceoverExample: FunctionComponent = (props) => {

	return(
			<View style={{width: "100%"}}>
				<View style={{width: "50%"}}>
					<DefaultComponentCard small={true} renderTop={(width) => {
						return(
							<View style={{width: width, height: width, backgroundColor: "red"}}>
								<Text>{"This is the backgorund"}</Text>
							</View>
						)
					}}
										  renderTopForeground={(width) => {
											  return(
												  <ImageOverlays width={width}>
													  <ImageOverlayCustom position={ImageOverlayPosition.TOP_RIGHT}>
														  <View style={{backgroundColor: "orange"}}>
															  <Text>{"TOP_RIGHT"}</Text>
														  </View>
													  </ImageOverlayCustom>
													  <ImageOverlayCustom position={ImageOverlayPosition.BOTTOM_RIGHT}>
														  <View style={{backgroundColor: "orange"}}>
															  <Text>{"BOTTOM_RIGHT"}</Text>
														  </View>
													  </ImageOverlayCustom>
												  </ImageOverlays>
											  )
										  }}
					/>
				</View>
				<View style={{width: "50%"}}>
					<DefaultComponentCard liked={true} small={true} renderTop={(width) => {
						return(
							<View style={{width: width, height: width, backgroundColor: "red"}}>
								<Text>{"This is the backgorund"}</Text>
							</View>
						)
					}}
										  renderTopForeground={(width) => {
											  return(
												  <ImageOverlays width={width}>
													  <ImageOverlayCustom position={ImageOverlayPosition.TOP_RIGHT}>
														  <View style={{backgroundColor: "orange"}}>
															  <Text>{"TOP_RIGHT"}</Text>
														  </View>
													  </ImageOverlayCustom>
													  <ImageOverlayCustom position={ImageOverlayPosition.BOTTOM_RIGHT}>
														  <View style={{backgroundColor: "orange"}}>
															  <Text>{"BOTTOM_RIGHT"}</Text>
														  </View>
													  </ImageOverlayCustom>
												  </ImageOverlays>
											  )
										  }}
					/>
				</View>
				<Divider></Divider>
				<View style={{width: 300, height: 300, backgroundColor: "red"}}>
					<ImageOverlays>
						<ImageOverlayCustom position={ImageOverlayPosition.TOP_RIGHT} width={300}>
							<View style={{backgroundColor: "orange"}}>
								<Text>{"TOP_RIGHT"}</Text>
							</View>
						</ImageOverlayCustom>
						<ImageOverlayCustom position={ImageOverlayPosition.BOTTOM_RIGHT} width={300}>
							<View style={{backgroundColor: "orange"}}>
								<Text>{"BOTTOM_RIGHT"}</Text>
							</View>
						</ImageOverlayCustom>
					</ImageOverlays>
				</View>
				<Divider></Divider>
				<Text>Text 1</Text>
				<Divider/>
				<Text>Tooltip outside with accesibility (not working)</Text>
				<Tooltip label={"Tooltip"} accessibilityLabel={"Tooltip A"} >
					<Button style={{backgroundColor: "transparent"}}>
						<Icon name={"magnify"}  />
					</Button>
				</Tooltip>
				<Divider/>
				<Text>Tooltip inside with accesibility (not working)</Text>
				<Button style={{backgroundColor: "transparent"}}>
					<Tooltip label={"Tooltip"} accessibilityLabel={"Tooltip B"} >
						<Icon name={"magnify"}  />
					</Tooltip>
				</Button>
				<Divider/>
				<Text>Tooltip seperated with accesibility (working)</Text>
				<Button style={{backgroundColor: "transparent"}}>
					<Tooltip label={"Tooltip"} >
						<Icon name={"magnify"} accessibilityLabel={"Tooltip B"} />
					</Tooltip>
				</Button>
				<Divider/>
				<Text>Tooltip seperated with accesibility (working "Button")</Text>
				<Button style={{backgroundColor: "transparent"}} accessibilityLabel={"Button"}>
					<Tooltip label={"Tooltip"} >
						<Icon name={"magnify"} />
					</Tooltip>
				</Button>
				<Divider/>
				<Text>Tooltip seperated with accesibility (working "Button")</Text>
				<Button style={{backgroundColor: "transparent"}} accessibilityLabel={"Button"}>
					<Tooltip label={"Tooltip"} >
						<Icon name={"magnify"} accessibilityLabel={"Icon"} />
					</Tooltip>
				</Button>
				<Divider/>
				<Text>{"Icon without Accessibility: Not working"}</Text>
				<Icon name={"check"} size={20} color={"green"}/>
				<Divider/>
				<Text>{"Icon inside icon Accessibility: Working"}</Text>
				<Icon accessibilityLabel={"check"} name={"check"} size={20} color={"green"}/>
				<Divider/>
				<Text>{"Icon wrapped in view Accessibility: Not working"}</Text>
				<View accessibilityLabel={"check"}>
					<Icon name={"check"} size={20} color={"green"}/>
				</View>
				<Divider />
				<Text>{"Touchable Icon with Accessibility: A (not working)"}</Text>
				<ViewPixelRatio style={{}}>
					<View accessibilityLabel={"Accessibility: A"}>
						<TouchableOpacity onPress={() => {

						}}>
							<Icon name={"check"} color={"green"} />
						</TouchableOpacity>
					</View>
				</ViewPixelRatio>
				<Divider />
				<Text>{"Touchable Icon with Accessibility: B (not working)"}</Text>
				<ViewPixelRatio style={{}} accessibilityLabel={"Accessibility: B"}>
						<TouchableOpacity onPress={() => {

						}}>
							<Icon name={"check"} color={"green"} />
						</TouchableOpacity>
				</ViewPixelRatio>
				<Divider />
				<Text>{"Touchable Icon with Accessibility: C (working)"}</Text>
				<ViewPixelRatio style={{}} >
					<TouchableOpacity accessibilityLabel={"Accessibility: C"} onPress={() => {

					}}>
						<Icon name={"check"} color={"green"} />
					</TouchableOpacity>
				</ViewPixelRatio>
				<Divider />
				<Text>{"Touchable Icon with Accessibility: D (working)"}</Text>
				<ViewPixelRatio style={{}} >
					<TouchableOpacity onPress={() => {}}>
						<Icon accessibilityLabel={"Accessibility: D"} name={"check"} color={"green"} />
					</TouchableOpacity>
				</ViewPixelRatio>
				<Divider />
				<Text>{"Touchable Icon with Accessibility: E"}</Text>
				<ViewPixelRatio style={{}} >
					<TouchableOpacity accessibilityLabel={"Accessibility: 1"} onPress={() => {}}>
						<Icon accessibilityLabel={"Accessibility: 2"} name={"check"} color={"green"} />
					</TouchableOpacity>
				</ViewPixelRatio>
				<Divider />
				<Text>{"Touchable"}</Text>
				<View style={{width: 300, height: 300, backgroundColor: "red"}}>
					<View style={{width: 200, height: 200, backgroundColor: "orange"}}>
						<View style={{width: 200, height: 100, backgroundColor: "yellow"}}>
							<Text>{"YELLOW YELLOW YELLOW YELLOW YELLOW YELLOW YELLOW YELLOW"}</Text>
						</View>
						<View style={{width: 200, height: 100, backgroundColor: "brown"}}>
							<Text>{"BROWN BROWN BROWN BROWN BROWN BROWN BROWN BROWN "}</Text>
						</View>
					</View>
					<View style={{position: "absolute", top: 0, left: 0, width: 100, height: 100, backgroundColor: "green"}}>
						<Text>{"GREEN GREEN GREEN GREEN"}</Text>
					</View>
					<Text>{"RED RED RED RED RED RED RED RED RED RED RED RED RED RED RED RED RED RED RED RED"}</Text>
				</View>
				<Divider />
			</View>
	)
}
