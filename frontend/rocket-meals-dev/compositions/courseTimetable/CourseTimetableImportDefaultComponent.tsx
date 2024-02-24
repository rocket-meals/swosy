import React, {FunctionComponent, useState} from "react";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {View, Text, TextInput} from "@/components/Themed";
import {FormControl} from "@gluestack-ui/themed";
import {MyButton} from "@/components/buttons/MyButton";

interface AppState {
    onCloseModal: () => void;
    onLogin: (username: string, password: string) => Promise<any>;
    initialPassword: string;
    initialEmail: string;
}

export const CourseTimetableImportDefaultComponent: FunctionComponent<AppState> = (props) => {

    const [password, setPassword] = useState(props?.initialPassword || "");
    const [showPassword, setShowPassword] = useState(false);
    const [loginInitiated, setLoginInitiated] = useState(false);
    const [loginIncorrect, setLoginIncorrect] = useState(false);
    const [email, setEmail] = useState(props?.initialEmail || "");

    const loginDisabled = loginInitiated || email.length === 0 || password.length === 0;

    let handleCloseModal = props.onCloseModal;

    const toggleShowPasswordIcon = showPassword ? "eye" : "eye-off";
    let rightElement = (
        <MyButton useOnlyNecessarySpace={true} leftIcon={toggleShowPasswordIcon} onPress={() => {setShowPassword(!showPassword)}}  accessibilityLabel={"Hide/Show Password"}/>
    )

    return (
            <View style={{width: "100%", justifyContent: "center"}}>
                <View>
                    <Text>{"Your credentials wont be saved and send directly to Stud.IP."}</Text>
                </View>
                    <View style={{marginVertical: 10}}>
                        <TextInput
                            isDisabled={loginInitiated}
                            value={email}
                            nativeID={"username"}
                            type={"email"}
                            //TODO extract the on change method to an extra class to call the callback
                            onChange={async (event) => { // @ts-ignore
                                setEmail(event.nativeEvent.text)
                                setLoginIncorrect(false)
                            }}
                            placeholder="Email" size="lg" />
                    </View>
                    <View style={{marginVertical: 10}} >
                        <TextInput
                            isDisabled={loginInitiated}
                            value={password}
                            nativeID={"password"}
                            type={showPassword ? "text" : "password"}
                            InputRightElement={rightElement}
                            onChange={(event) => { // @ts-ignore
                                setPassword(event.nativeEvent.text)
                                setLoginIncorrect(false)
                            }} placeholder="Password" size="lg" />
                    </View>
                <View style={{
                    width: "100%",
                }}>
                    <MyButton disabled={loginDisabled}
                              text={"Login"+" & "+" "+"Import"}
                              accessibilityLabel={"Login"+" & "+" "+"Import"}
                              onPress={async () => {
                                  setLoginInitiated(true);
                                  let onLogin = props?.onLogin;
                                  if (onLogin) {
                                      let success = await onLogin(email, password);
                                      if (success) {
                                          handleCloseModal();
                                      } else {
                                          setLoginIncorrect(true);
                                      }
                                  }
                                  setLoginInitiated(false);
                              }}>
                    </MyButton>
                </View>
            </View>
    );
}
