let swosyLogo = require('../../assets/logo/customers/swosy.png');

export class DEMO_ASSET_IDS {
    static SWOSY_LOGO = "demo-swosy"
}

export class DirectusImageDemoSources {

    static getSource(assetId: string | undefined | null){
        switch (assetId){
            case DEMO_ASSET_IDS.SWOSY_LOGO: return swosyLogo;
        }
        return null;
    }

}
