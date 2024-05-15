import axios from "axios";
import cheerio from 'cheerio';

const baseUrl = 'https://www.studentenwerk-hannover.de';
// https://www.studentenwerk-hannover.de/wohnen/wohnhaeuser
const apartmentsUrl = `${baseUrl}/wohnen/wohnhaeuser`;

export class StudentenwerkHannoverApartments_Parser {

    constructor() {

    }

    async getJSONList() {
        let realNewsItems = await this.getRealItems();
        return [...realNewsItems];
    }

    async getRealItem(apartmentUrl) {
        let response = await axios.get(apartmentUrl);
        console.log("Fetched url");
        const $ = cheerio.load(response.data);

        return {

        };
    }

    async getCoordiantesFromAdress(address) {
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

    getImageUrlFromElement(cheerioAPI, element) {
        try{
            let mensaImag = cheerioAPI(element).find('div.mensaImag');
            //console.log("mensaImag", mensaImag)
            /**
             mensaImag LoadedCheerio {
               '0': <ref *1> Element {
                 parent: Element {
                   parent: [Element],
                   prev: [Text],
                   next: [Text],
                   startIndex: null,
                   endIndex: null,
                   children: [Array],
                   name: 'a',
                   attribs: [Object: null prototype],
                   type: 'tag',
                   namespace: 'http://www.w3.org/1999/xhtml',
                   'x-attribsNamespace': [Object: null prototype],
                   'x-attribsPrefix': [Object: null prototype]
                 },
                 prev: Text {
                   parent: [Element],
                   prev: null,
                   next: [Circular *1],
                   startIndex: null,
                   endIndex: null,
                   data: '\n                                    ',
                   type: 'text'
                 },
                 next: Text {
                   parent: [Element],
                   prev: [Circular *1],
                   next: [Element],
                   startIndex: null,
                   endIndex: null,
                   data: '\n                                    ',
                   type: 'text'
                 },
                 startIndex: null,
                 endIndex: null,
                 children: [ [Text] ],
                 name: 'div',
                 attribs: [Object: null prototype] {
                   class: 'mensaImag',
                   style: 'background: url(/fileadmin/user_upload/Bilder/2_Wohnen/WH_KaWi_Obst.JPG) no-repeat;'
                 },
                 type: 'tag',
                 namespace: 'http://www.w3.org/1999/xhtml',
                 'x-attribsNamespace': [Object: null prototype] { class: undefined, style: undefined },
                 'x-attribsPrefix': [Object: null prototype] { class: undefined, style: undefined }
               },
               length: 1,
               options: { xml: false, decodeEntities: true },
               _root: <ref *2> LoadedCheerio {
                 '0': Document {
                   parent: null,
                   prev: null,
                   next: null,
                   startIndex: null,
                   endIndex: null,
                   children: [Array],
                   type: 'root',
                   'x-mode': 'no-quirks'
                 },
                 length: 1,
                 options: { xml: false, decodeEntities: true },
                 _root: [Circular *2]
               },
               prevObject: LoadedCheerio {
                 '0': Element {
                   parent: [Element],
                   prev: [Text],
                   next: [Text],
                   startIndex: null,
                   endIndex: null,
                   children: [Array],
                   name: 'div',
                   attribs: [Object: null prototype],
                   type: 'tag',
                   namespace: 'http://www.w3.org/1999/xhtml',
                   'x-attribsNamespace': [Object: null prototype],
                   'x-attribsPrefix': [Object: null prototype]
                 },
                 length: 1,
                 options: { xml: false, decodeEntities: true },
                 _root: <ref *3> LoadedCheerio {
                   '0': [Document],
                   length: 1,
                   options: [Object],
                   _root: [Circular *3]
                 }
               }
             }
             */
            let attribs = mensaImag[0].attribs;
            let style = attribs.style;
            console.log("style", style)
            let imageUrl = style.split("url(")[1].split(")")[0];
            return baseUrl + imageUrl;
        } catch (error) {
            console.log("Error while fetching image url")
            console.log(error)
            return undefined
        }
    }

    async getRealItems() {
        try {
            console.log("getRealItems")
            let response = await axios.get(apartmentsUrl);
            console.log("Fetched url")
            const cheerioAPI = cheerio.load(response.data);

            // Find all apartment divs
            let data = [];
            cheerioAPI('div.wohnheimListView').each((index, element) => {
                let name = cheerioAPI(element).find('h3').text().trim();
                console.log("name: " + name)
                let imageUrl = this.getImageUrlFromElement(cheerioAPI, element);
                let apartmentUrl = baseUrl + cheerioAPI(element).find('a').attr('href');

                data.push({
                    external_identifier: "apartment_" + name.replace(/\W+/g, '_'),
                    available_from: null,
                    handicapped_accessible: false,
                    family_friendly: false,
                    singleflat: false,
                    building: {
                        external_identifier: "building_" + name.replace(/\W+/g, '_'),
                        url: apartmentUrl,
                        alias: name,
                        image_remote_url: imageUrl,
                        year_of_construction: null
                    }
                });
            });

            return data;
        } catch (error) {
            console.log(error);
        }
    }
}
