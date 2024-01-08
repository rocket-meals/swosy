// @ts-nocheck
import React, {useEffect, useState} from "react";
import {Platform} from "react-native";
import {ConfigHolder} from "../ConfigHolder";
import {keyof} from "ts-keyof";
import {Button, Flex, FormControl, Input, View, Text} from "native-base";
import {FormButton} from "../components/buttons/FormButton";
import {InternalLink} from "../navigation/InternalLink";
import {Login} from "./Login";
import ServerAPI from "../ServerAPI";
import {handleLoginWithCredentials} from "./EmailLogin";
import {TranslationKeys} from "../translations/TranslationKeys";

export const Register = (props) => {

	let hideDrawer = false;

  const [registerInitiated, setRegisterInitiated] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")

  const useTranslation = ConfigHolder.plugin.getUseTranslationFunction();
  const translation_email = useTranslation(TranslationKeys.email);
  const translation_register = useTranslation(TranslationKeys.register);
  const translation_password = useTranslation(TranslationKeys.password);
  const translation_password_show = useTranslation(TranslationKeys.password_visible);
  const translation_password_hide = useTranslation(TranslationKeys.password_hidden);
  const translation_confirm_password = useTranslation(TranslationKeys.confirm_password);
  const translation_sign_in = useTranslation(TranslationKeys.sign_in);

	if(!ConfigHolder.instance.isDrawerHidden()){
		//console.log("Login calls hide drawer");
		hideDrawer = true;
	}
	if(Platform.OS!=="web"){
		hideDrawer = false;
	}

	// corresponding componentDidMount
	useEffect(() => {
		if(hideDrawer){
			ConfigHolder.instance.setHideDrawer(true);
		}

	}, [props?.route?.params])

	if(hideDrawer){
		return null;
	}

	async function registerUser(){
    if(!registerInitiated){
      await setRegisterInitiated(true);

      if(password===passwordConfirm){
        try{
          let directus = ServerAPI.getPublicClient();

          let answer = await directus.users.createOne({
            email: email,
            password: password
          })

          console.log("Send login request");
          await handleLoginWithCredentials(email, password);
        } catch (err){
          console.log(err);
        } finally {
          await setRegisterInitiated(false);
        }
      }
    }
  }


  return (
    <View style={{flex: 1}}>
      <Text fontSize="2xl" fontWeight={800}>
        {translation_register}
      </Text>
      <FormControl isRequired>
        <View style={{marginVertical: 10}}>
          <Input
            isDisabled={registerInitiated}
            onChange={(event) => { // @ts-ignore
              setEmail(event.target.value)}}
            type="email"
            value={email}
            placeholder={translation_email}
            size="lg" />
        </View>
      </FormControl>
      <FormControl isRequired>
        <View style={{marginVertical: 10}} >
          <Input
            isDisabled={registerInitiated}
            nativeID={"password"}
            type={"password"}
            onChange={(event) => { // @ts-ignore
              setPassword(event.nativeEvent.text)
            }} placeholder={translation_password} size="lg" />
        </View>
      </FormControl>
      <FormControl isRequired>
        <View style={{marginVertical: 10}} >
          <Input
            isDisabled={registerInitiated}
            nativeID={"password"}
            type={"password"}
            onChange={(event) => { // @ts-ignore
              setPasswordConfirm(event.nativeEvent.text)
            }} placeholder={translation_confirm_password} size="lg" />
        </View>
      </FormControl>
      <Flex flexDirection={"row"} justify={"space-between"}>
        <FormButton disabled={registerInitiated} onPress={() => {registerUser()}}>
          {translation_register}
        </FormButton>
        <InternalLink destination={Login}>{translation_sign_in}</InternalLink>
      </Flex>
    </View>
  )
}

Register.displayName = keyof({ Register });
