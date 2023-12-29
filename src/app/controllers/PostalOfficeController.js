import PostalOffice from "../models/Postal_office.js"; 

class PostalOfficeController {
    getPostalOffice(req, res, next) {
        const selectedWorkspace = req.query.workspace;
        if (selectedWorkspace && (selectedWorkspace === 'warehouse' || selectedWorkspace === 'postal_office')) {
            console.log(selectedWorkspace);
            PostalOffice.find({ workspace: selectedWorkspace })
                .select('_id name')  // Corrected: include 'name' field
                .exec((err, postalOffices) => {
                    if (err) {
                        console.error('Error fetching postal offices:', err);
                        res.status(500).json({ error: 'Internal Server Error' });
                    } else {
                        res.json(postalOffices);
                    }
                });
        } else {
            res.status(400).json({ error: 'Invalid workspace' });
        }
    }
}

export default new PostalOfficeController();
