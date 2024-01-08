export default class UserHelper{

	static USER_ROLE_ANONYMOUS = "public";

	static getAnonymousUser(){
		return {
			role: UserHelper.USER_ROLE_ANONYMOUS,
			id: null,
			email: null,
			title: null,
			first_name: "Guest",
			last_name: "Guest"
		}
	}

	static isAnonymous(user){
		return !user?.role || user?.role === UserHelper.USER_ROLE_ANONYMOUS; //if no role found or role is "public" a user is a guest
	}

}
