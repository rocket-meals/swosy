import axios from "axios";
import JSSoup from 'jssoup';


const baseUrl = 'https://www.studentenwerk-hannover.de';
// https://www.studentenwerk-hannover.de/wohnen/wohnhaeuser
const apartmentsUrl = `${baseUrl}/wohnen/wohnhaeuser`;

export class StudentenwerkHannoverApartments_Parser {

    constructor() {

    }

    async getJSONList(){
        //let demoNewsItem = await this.getDemoNewsItem();
        let realNewsItems = await this.getRealItems();
        return [...realNewsItems];
    }

    async getRealItem(apartmentUrl){
        let response = await axios.get(apartmentUrl);
        console.log("Fetched url")
        let soup = new JSSoup.default(response.data);

        return {

        };
    }

    async getCoordiantesFromAdress(address){
            const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    q: address,
                    format: 'json'
                }
            });
            if (response.data && response.data.length > 0) {
                return {
                    latitude: response.data[0].lat,
                    longitude: response.data[0].lon
                };
            } else {
                return null;
            }
    }

    async getRealItems() {
        try {
            console.log("getRealItems")
            let response = await axios.get(apartmentsUrl);
            console.log("Fetched url")
            let soup = new JSSoup.default(response.data);

            // Find all apartment divs
            let apartmentDivs = soup.findAll('div', 'wohnheimListView');

            let data = apartmentDivs.map((apartmentDiv) => {
                let name = apartmentDiv.find('h3').text.trim();
                let imageUrl = apartmentDiv.find('div', 'mensaImag').attrs['style'].match(/url\(([^)]+)\)/)[1];
                let apartmentUrl = baseUrl + apartmentDiv.find('a').attrs['href'];

                return {
                    external_identifier: "apartment_" + name.replace(/\W+/g, '_'),
                    available_from: null,
                    handicapped_accessible: false,
                    family_friendly: false,
                    singleflat: false,
                    building: {
                        external_identifier: "building_" + name.replace(/\W+/g, '_'),
                        url: apartmentUrl,
                        alias: name,
                        image_remote_url: baseUrl + imageUrl,
                        year_of_construction: null
                    }
                };
            });

            return data;
        } catch (error) {
            console.log(error);
        };
    }



}
