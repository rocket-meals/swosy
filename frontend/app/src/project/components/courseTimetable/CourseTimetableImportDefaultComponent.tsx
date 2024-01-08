// @ts-nocheck
import React, {FunctionComponent, useState} from "react";
import {Button, FormControl, Input, ScrollView, Text, View} from "native-base";
import {Icon} from "../../../kitcheningredients";
import {MyButton} from "../buttons/MyButton";

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

    let handleCloseModal = props?.onCloseModal;

    const toggleShowPasswordIcon = showPassword ? "eye" : "eye-off";
    let rightElement = (
        <Button roundedLeft="0" onPress={() => {setShowPassword(!showPassword)}}>
            <Icon name={toggleShowPasswordIcon} size="sm" />
        </Button>
    )

    return (
        <ScrollView style={{width: "100%"}}>
            <View style={{width: "100%", justifyContent: "center"}}>
                <Text>{"Your credentials wont be saved and send directly to Stud.IP."}</Text>
                <FormControl isRequired>
                    <View style={{marginVertical: 10}}>
                        <Input
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
                </FormControl>
                <FormControl isInvalid={loginIncorrect} isRequired>
                    <View style={{marginVertical: 10}} >
                        <Input
                            isDisabled={loginInitiated}
                            value={password}
                            nativeID={"password"}
                            type={showPassword ? "text" : "password"}
                            InputRightElement={rightElement}
                            onChange={(event) => { // @ts-ignore
                                setPassword(event.nativeEvent.text)
                                setLoginIncorrect(false)
                            }} placeholder="Password" size="lg" />
                        <FormControl.ErrorMessage>
                            Incorrect email or password
                        </FormControl.ErrorMessage>
                    </View>
                </FormControl>
                <MyButton disabled={loginDisabled}
                          label={"Login"+" & "+" "+"Import"}
                          accessibilityLabel={"Login"+" & "+" "+"Import"}
                          onPress={async () => {
                    setLoginInitiated(true);
                    let onLogin = props?.onLogin;
                    if (onLogin) {
                        let success = await onLogin(email, password);
                        if (success) {
                            handleCloseModal();
                            return true;
                        } else {
                            setLoginIncorrect(true);
                        }
                    }
                    setLoginInitiated(false);
                }}>
                </MyButton>
            </View>
        </ScrollView>
    );
}
