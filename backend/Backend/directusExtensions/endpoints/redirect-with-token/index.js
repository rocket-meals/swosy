function configureRouter(
    listOfAllowedRedirects,
    router
) {
    router.get('/', (req, res) => {
        const refresh_token = req.cookies.directus_refresh_token;
        const redirect = req.query.redirect;
        const redirectURL = redirect + refresh_token;
        //TODO: check if redirect is in listOfAllowedRedirects
        //https://github.com/directus/directus/discussions/8867#discussioncomment-1977411
        res.redirect(redirectURL);
    });
}

function registerEndpoint(listOfAllowedRedirects = []) {
    return configureRouter.bind(null, listOfAllowedRedirects);
}

export default registerEndpoint()