JIE.io = (function () {
    function load_text_data(path) {
        const my_request = new Request(path, {
            method: 'GET'
        });

        async function process_status(response) {
            if (response.ok) {
                return Promise.resolve(response.text());
            }
            else {
                return Promise.reject(response.statusText);
            }
        }

        async function process() {
        try {
            let data = await process_status(await fetch(my_request))
            return Promise.resolve(data);
            }
            catch(error) {
                return Promise.reject(`Path: ${path}\nError: ${error}`);
            }
            
        }
        
        return process();
    }

    
    return {
        load_text_data: load_text_data,
    };
})();