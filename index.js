import * as xbt from './x360-utilities.js';

$(document).ready(function () {

	$(document).on('dragover drop', function (event) {
		if (!$(event.target).closest('#fileInput').length) {
			event.preventDefault();
			event.originalEvent.dataTransfer.dropEffect = 'none';
		}
	});

	$('#fileInput').on('change', function (event) {
		const inputFile = event.target.files[0];
		if (inputFile) {
			xbt.getPackageObject(inputFile).then(packageObject => {
				$('#package-object').empty();
				for (const key in packageObject) {
					if (packageObject.hasOwnProperty(key)) {
						let value = packageObject[key];
						if (value instanceof Blob) {
							$('#package-object').append($('<tr>').append(`
								<th scope="row">${key}</th>
								<td class="text-break"><img src="${URL.createObjectURL(value)}"></td>
							`));
						} else {
							if (typeof value === 'object') value = JSON.stringify(value);
							$('#package-object').append($('<tr>').append(`
								<th scope="row">${key}</th>
								<td class="text-break">${value}</td>
							`));
						}
					}
				}
			}).catch(error => {
				console.error(error);
			});
		}
	});
});
