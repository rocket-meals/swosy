export default class CustomFloaters {

    private static floaters: JSX.Element[] = [];

    static add(floater: JSX.Element) {
        CustomFloaters.floaters.push(floater);
    }

    static getFloaters(): JSX.Element[] {
        return CustomFloaters.floaters;
    }
}
