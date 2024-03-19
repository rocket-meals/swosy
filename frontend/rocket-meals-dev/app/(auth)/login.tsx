import {router, useLocalSearchParams} from 'expo-router';
import React, {useEffect, useState} from 'react';
import {Divider} from '@gluestack-ui/themed';
import {ServerAPI} from '@/helper/database/server/ServerAPI';
import {Text, TextInput, View} from '@/components/Themed';
import {AuthenticationData} from '@directus/sdk';
import {ButtonAuthAnonym} from '@/components/buttons/ButtonAuthAnonym';
import {
	getAnonymousUser,
	isUserLoggedIn,
	useCurrentUser,
	useLogoutCallback
} from '@/states/User';
import {ServerSsoAuthProviders} from '@/components/auth/ServerSsoAuthProviders';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {LoginLayout} from '@/components/auth/LoginLayout';
import {MyButton} from '@/components/buttons/MyButton';
import {useNickname} from '@/states/SynchedProfile';
import {SettingsRowProfileLanguage} from '@/compositions/settings/SettingsRowProfileLanguage';
import {IconNames} from '@/constants/IconNames';
import {MyGlobalActionSheetConfig, useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {NotAllowed} from "@/compositions/animations/NotAllowed";
import {AnimationAstronautComputer} from "@/compositions/animations/AnimationAstronautComputer";
import {useMyActionSheetConfigConfirmer} from "@/components/actionsheet/usePredefinedActionSheetConfigs";

const WARN_ANONYMOUS_ABOUT_MISSING_FUNCTIONALITIES = true;

export default function Login() {
	const loggedIn = isUserLoggedIn();
	const logout = useLogoutCallback()
	const [nickname, setNickname] = useNickname()

	const [changedLoginStatus, setChangedLoginStatus] = useState(false)

	const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

	const [showLoginWithUsernameAndPassword, setShowLoginWithUsernameAndPassword] = useState(false)
	const translation_show_login_with_username_and_password = useTranslation(TranslationKeys.show_login_with_username_and_password);
	const translation_sign_in= useTranslation(TranslationKeys.sign_in);
	const translation_currently_logged_in_as = useTranslation(TranslationKeys.currently_logged_in_as);
	const translation_if_you_want_to_login_with_this_account_please_press = useTranslation(TranslationKeys.if_you_want_to_login_with_this_account_please_press);
	const translation_continue = useTranslation(TranslationKeys.continue);
	const translation_logout = useTranslation(TranslationKeys.logout);
	const translation_email = useTranslation(TranslationKeys.email);
	const translation_password = useTranslation(TranslationKeys.password);

	const translation_anonymous_limitations = useTranslation(TranslationKeys.anonymous_limitations);

	const configAnynmousAttention: MyGlobalActionSheetConfig = useMyActionSheetConfigConfirmer({
		renderPreItemsContent: () => {
			return renderAnonymousAttention();
		},
		onConfirm: async () => {
			handleLoginAsAnonymous()
			return true
		},
		onCancel: async () => {
			return false
		}
	})

	// email and password for login
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')

	const [currentUser, setCurrentUser] = useCurrentUser()
	const [loginWithAccessTokenResult, setLoginWithAccessTokenResult] = useState<any>()

	const localSearchParams = useLocalSearchParams(); // get url params from router
	const directus_token = ServerAPI.getDirectusAccessTokenFromParams(localSearchParams);

	function signIn() {
		console.log('login.tsx signIn');
		router.replace('/(app)/home');
	}

	useEffect(() => {
		console.log('login.tsx useEffect loggedIn: changedLoginStatus: '+changedLoginStatus+' loggedIn: '+loggedIn);
		if (changedLoginStatus && loggedIn) {
			signIn();
		}
	}, [changedLoginStatus, loggedIn]);

	function renderAnonymousAttention() {
		return(
			<View style={{width: "100%"}}>
				<AnimationAstronautComputer />
				<View style={{
					width: "100%",
					paddingHorizontal: 20,
				}}>
					<View style={{
						width: "100%",
						paddingBottom: 20,
					}}>
						<Text>{translation_anonymous_limitations}</Text>
					</View>
				</View>
			</View>
		)
	}

	async function handleSuccessfulAuthenticationWithNewCurrentUser(new_current_user: any) {
		setCurrentUser(new_current_user);
		console.log('login.tsx handleSuccessfulAuthenticationWithNewCurrentUser', new_current_user)
		setChangedLoginStatus(true)
	}

	async function handleSuccessfulAuthenticationNonAnonymous(result: AuthenticationData) {
		// the result is irrelevant, just to make sure authentication was successful
		const me = await ServerAPI.getMe();
		handleSuccessfulAuthenticationWithNewCurrentUser(me)
	}

	async function handleFailedAuthentication(e: any) {
		console.log('login.tsx authentication failed')
		console.error(e)
		//router.replace('/login'); // clear url params
	}

	async function handleLoginAsAnonymous () {
		console.log('login.tsx proceed_to_authenticate_as_anonymous handleLoginAsAnonymous');
		const anonymous_user = getAnonymousUser();
		handleSuccessfulAuthenticationWithNewCurrentUser(anonymous_user)
	}

	async function proceed_to_authenticate_as_anonymous() {
		if(WARN_ANONYMOUS_ABOUT_MISSING_FUNCTIONALITIES){
			show(configAnynmousAttention)
		} else {
			handleLoginAsAnonymous()
		}
	}


	async function authenticate_with_access_token(directus_token: string | null | undefined) {
		console.log('login.tsx useEffect directus_token');
		if (directus_token) {
			console.log('login.tsx useEffect directus_token: '+directus_token);
			ServerAPI.authenticate_with_access_token(directus_token).then((result) => {
				if(result){
					handleSuccessfulAuthenticationNonAnonymous(result)
				} else {
					handleFailedAuthentication('No result')
				}
			}).catch((e) => {
				handleFailedAuthentication(e)
			})
		}
	}

	async function authenticate_with_email_and_password(email: string, password: string) {
		console.log('login.tsx useEffect email: '+email+' password: '+password);
		ServerAPI.authenticate_with_email_and_password(email, password).then((result) => {
			if(result){
				handleSuccessfulAuthenticationNonAnonymous(result)
			} else {
				handleFailedAuthentication('No result')
			}
		}).catch((e) => {
			handleFailedAuthentication(e)
		})
	}

	// UseEffect when directus_token changes, then call login with access token
	useEffect(() => {
		authenticate_with_access_token(directus_token);
	}, [directus_token]);

	function renderWhenLoggedIn() {
		if (loggedIn) {
			return (
				<>
					<Text>{translation_currently_logged_in_as+': '+nickname}</Text>
					<Text>{translation_if_you_want_to_login_with_this_account_please_press+': '+translation_continue}</Text>
					<View style={{height: 16}}></View>
					<View style={{flexDirection: 'row', width: '100%'}}>
						<View style={{flex: 1}}>
							<MyButton leftIcon={IconNames.logout_icon} accessibilityLabel={translation_logout} text={translation_logout} disabled={!loggedIn} onPress={logout} />
						</View>
						<View style={{width: 8}}></View>
						<View style={{flex: 1}}>
							<MyButton leftIcon={IconNames.sign_in_icon}
								accessibilityLabel={translation_continue}
								text={translation_continue}
								disabled={!loggedIn}
								onPress={() => {
									console.log('Handle sign in');
									signIn();
								}}
							/>
						</View>
					</View>
				</>
			)
		}
	}

	function renderEmployeeLogin() {
		if (showLoginWithUsernameAndPassword) {
			return (
				<>
					<TextInput value={email} onChangeText={setEmail} placeholder={translation_email} />
					<View style={{height: 8}}></View>
					<TextInput isPassword={true} value={password} onChangeText={setPassword} placeholder={translation_password} />
					<View style={{height: 8}}></View>
					<MyButton
						leftIconColoredBox={true}
						leftIcon={IconNames.sign_in_icon}
						text={translation_sign_in}
						accessibilityLabel={translation_sign_in}
						tooltip={translation_sign_in}
						disabled={loggedIn || !email || !password}
						onPress={() => {
							authenticate_with_email_and_password(email, password)
						}}
					/>
				</>
			)
		}

		return (
			<>
				<MyButton
					leftIconColoredBox={false}
					leftIcon={IconNames.sign_in_with_mail_icon}
					text={translation_show_login_with_username_and_password}
					accessibilityLabel={translation_show_login_with_username_and_password}
					onPress={() => {
						setShowLoginWithUsernameAndPassword(!showLoginWithUsernameAndPassword)
					}}
				/>
			</>
		)
	}

	function renderWhenNotLoggedIn() {
		if (!loggedIn) {
			return (
				<>
					<ServerSsoAuthProviders />
					<ButtonAuthAnonym onPress={proceed_to_authenticate_as_anonymous} />
					<View style={{height: 16}}></View>
					<Divider />
					<View style={{height: 16}}></View>
					{renderEmployeeLogin()}
				</>
			)
		}
	}

	return (
		<LoginLayout>
			<Text style={{fontSize: 24, fontWeight: 'bold'}}>{translation_sign_in}</Text>
			<View style={{height: 16}}></View>
			<SettingsRowProfileLanguage />
			<View style={{height: 16}}></View>
			{renderWhenLoggedIn()}
			{renderWhenNotLoggedIn()}
			<View style={{height: 16}}></View>
		</LoginLayout>
	);
}