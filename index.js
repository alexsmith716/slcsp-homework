const fs = require('fs');
const papa = require('papaparse');


const calculateSlcsp = () => {

	function filterRow(row) {
		return row.metal_level === 'Silver';
	}

	function filterData(data) {
		return data.filter(filterRow);
	}

	let plans = fs.readFileSync('plans.csv', 'utf8');
	let zips = fs.readFileSync('zips.csv', 'utf8');
	let slcsp = fs.readFileSync('slcsp.csv', 'utf8');

	papa.parse(plans, {
		delimiter: ',',
		header: true,
		complete: (res) => {
			plans = filterData(res.data);
		}
	});
	
	papa.parse(zips, {
		delimiter: ',',
		header: true,
		complete: (res) => {
			zips = res.data;
		}
	});

	papa.parse(slcsp, {
		delimiter: ',',
		header: true,
		complete: (res) => {
			slcsp = res.data;
		}
	});

	// remove all empty rows in 'slcsp.csv'
	slcsp = slcsp.filter(slcsp => !isNaN(parseInt(slcsp.zipcode)));

	// for each zip in 'slcsp.csv', apply function calculateSLCSP()
	slcsp.forEach(calculateSLCSP);

	function calculateSLCSP(value, index, array) {

		// grab all 'zips.csv' objects matching the 'slcsp.csv' zip
		const matchingZipObjectsArray = zips.filter(zip => {
			return zip.zipcode === value.zipcode;
		});

		// create array of all rate_area's to evaluate more than one rate area
		const rateAreasArray = matchingZipObjectsArray.map(rate => rate.rate_area);

		// A ZIP code can also be in more than one rate area
		// data structure Set() will indicate which zip spans multiple rate areas 
		const rateAreasDuplicatesArray = [...new Set(rateAreasArray)];

		//	In that case (rateAreasDuplicatesArray.length > 1), the answer is ambiguous and should be left blank
		if (rateAreasDuplicatesArray.length === 1) {
			const filteredStateRatePlansArray = plans.filter(calculateSilverStateRateAreas);

			function calculateSilverStateRateAreas(value, index) {
				return (value.state === matchingZipObjectsArray[0].state) && (value.rate_area === matchingZipObjectsArray[0].rate_area);
			}

			// evaluate slcsp if more than one silver plan available
			if (filteredStateRatePlansArray.length > 2) {
				filteredStateRatePlansArray.sort((a, b) => a.rate - b.rate);
				const jp = JSON.parse(filteredStateRatePlansArray[1].rate)
				const tf = jp.toFixed(2);
				value.rate = tf;
			}
		}
	}
	const calculatedSlcsp = papa.unparse(slcsp);
	console.log(calculatedSlcsp);
}

calculateSlcsp();
