export async function getPackageObject(inputFile) {

	const packageReadOffsets = 			['0x0', '0x971A'];

	const packageHeaderOffsets = {
		packageMagic:					['0x0', '0x4'],
		packageCertOwnerConsoleID: 		['0x6', '0xB'],
		packageCertOwnerConsolePN: 		['0xB', '0x1F'],
		packageCertOwnerConsoleType: 	['0x1F', '0x20'],
		packageCertDateOfGeneration: 	['0x20', '0x28'],
		packagePublicExponent: 			['0x28', '0x2C'],
		packagePublicModulus: 			['0x2C', '0xAC'],
		packageCertSignature: 			['0xAC', '0x1AC'],
		packageSignature: 				['0x1AC', '0x22C'],
	};

	const packageMetadataOffsets = {
		packageLicensingData: 			['0x22C', '0x32C'],
		packageHeaderHash: 				['0x32C', '0x340'],
		packageHeaderSize: 				['0x340', '0x344'],
		packageContentType: 			['0x344', '0x348'],
		packageMetadataVersion: 		['0x348', '0x34C'],
		packageContentSize: 			['0x34C', '0x354'],
		packageMediaID: 				['0x354', '0x358'],
		packageVersion: 				['0x358', '0x35C'],
		packageBaseVersion: 			['0x35C', '0x360'],
		packageTitleID: 				['0x360', '0x364'],
		packagePlatform: 				['0x364', '0x365'],
		packageExecutableType: 			['0x365', '0x366'],
		packageDiscNumber: 				['0x366', '0x367'],
		packageDiscInSet: 				['0x367', '0x368'],
		packageSaveGameID: 				['0x368', '0x36C'],
		packageConsoleID: 				['0x36C', '0x371'],
		packageProfileID: 				['0x371', '0x379'],
		packageVolumeDescriptor: 		['0x379', '0x39D'],
		packageDataFileCount: 			['0x39D', '0x3A1'],
		packageDataFileCombinedSize: 	['0x3A1', '0x3A9'],
		pacakgeDescriptorType: 			['0x3A9', '0x3AD'],
		packageDeviceID: 				['0x3FD', '0x411'],
		packageDisplayName: 			['0x411', '0xD11'],
		packageDisplayDescription: 		['0xD11', '0x1611'],
		packagePublisherName: 			['0x1611', '0x1691'],
		packageTitleName: 				['0x1691', '0x1711'],
		packageTransferFlags: 			['0x1711', '0x1712'],
	};

	const fileMetadataV1Offsets = {
		packageThumbnailImageSize: 		['0x1712', '0x1716'],
		packageTitleThumbnailImageSize: ['0x1716', '0x171A'],
		packageThumbnailImage: 			['0x171A', '0x571A'],
		packageTitleThumbnailImage: 	['0x571A', '0x971A'],
	};

	const fileMetadataV2Offsets = {
		packageSeriesID: 				['0x3B1', '0x3C1'],
		packageSeasonID: 				['0x3C1', '0x3D1'],
		packageSeasonNumber: 			['0x3D1', '0x3D3'],
		packageEpisodeNumber: 			['0x3D3', '0x3D5'],
		packageThumbnailImage: 			['0x171A', '0x541A'],
		packageAdditionalDisplayNames: 	['0x541A', '0x571A'],
		packageTitleThumbnailImage: 	['0x571A', '0x941A'],
		packageAdditionalDisplayDesc: 	['0x941A', '0x971A'],
	};

	const packageObject = {};

	const readFileSliceAsync = async (inputFile, startOffset, endOffset) => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (event) => resolve(new Uint8Array(event.target.result.slice(startOffset, endOffset)));
			reader.onerror = (error) => reject(error);
			reader.readAsArrayBuffer(inputFile.slice(startOffset, endOffset));
		});
	};

	try {
		const fileContent = await readFileSliceAsync(inputFile, parseInt(packageReadOffsets[0], 16), parseInt(packageReadOffsets[1], 16));

		packageObject['packageMagic'] = Array.from(fileContent.slice(parseInt(packageHeaderOffsets['packageMagic'][0], 16), parseInt(packageHeaderOffsets['packageMagic'][1], 16))).map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();

		switch (packageObject['packageMagic']) {
			case '434F4E20':
				for (const headerName in packageHeaderOffsets) {
					let startOffset = parseInt(packageHeaderOffsets[headerName][0], 16);
					let endOffset = parseInt(packageHeaderOffsets[headerName][1], 16);

					const headerValue = Array.from(fileContent.slice(startOffset, endOffset)).map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();

					switch (headerName) {
						case 'packageCertOwnerConsolePN':
						case 'packageCertDateOfGeneration':
							packageObject[headerName] = headerValue.match(/.{1,2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
							break;
						default:
							packageObject[headerName] = headerValue;
							break;
					}
				}
				break;
			case '4C495645':
			case '50495253':
				packageObject['packageSignature'] = Array.from(fileContent.slice(parseInt('0x4', 16), parseInt('0x104', 16))).map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
				break;
			default:
				throw Error('Unsupported file type');
		}

		for (const metadataName in packageMetadataOffsets) {
			const startOffset = parseInt(packageMetadataOffsets[metadataName][0], 16);
			const endOffset = parseInt(packageMetadataOffsets[metadataName][1], 16);

			const metadataValue = Array.from(fileContent.slice(startOffset, endOffset)).map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();

			switch (metadataName) {
				case 'packageLicensingData':
					packageObject[metadataName] = metadataValue.match(/.{1,32}/g).map(license => ({
						licenseID: Number((BigInt.asIntN(64, BigInt(`0x${license.slice(0, 16)}`) << 32n) >> 32n)),
						licenseBits: Number(BigInt.asIntN(32, BigInt(`0x${license.slice(16, 24)}`))),
						licenseFlags: Number(BigInt.asIntN(32, BigInt(`0x${license.slice(24, 32)}`)))
					}));
					break;
				case 'packageHeaderSize':
				case 'packageMediaID':
				case 'packageTitleID':
				case 'packageSaveGameID':
				case 'pacakgeDescriptorType':
					packageObject[metadataName] = parseInt(metadataValue, 16) >>> 0;
					break;
				case 'packageContentType':
				case 'packageMetadataVersion':
				case 'packageVersion':
				case 'packageBaseVersion':
				case 'packageDataFileCount':
					packageObject[metadataName] = Number(BigInt.asIntN(32, BigInt(`0x${metadataValue}`)));
					break;
				case 'packageContentSize':
				case 'packageDataFileCombinedSize':
					packageObject[metadataName] = Number((BigInt.asIntN(64, BigInt(`0x${metadataValue}`) << 32n) >> 32n));
					break;
				case 'packageDisplayName':
				case 'packageDisplayDescription':
					packageObject[metadataName] = metadataValue.match(/.{1,512}/g).map((locale) => Array.from({ length: locale.length / 4 }, (_, i) => String.fromCharCode(parseInt(locale.substr(i * 4, 4), 16))).join('').replace(/\u0000/g, ''));
					break;
				case 'packagePublisherName':
				case 'packageTitleName':
					packageObject[metadataName] = Array.from({ length: metadataValue.length / 4 }, (_, i) => String.fromCharCode(parseInt(metadataValue.substr(i * 4, 4), 16))).join('').replace(/\u0000/g, '');
					break;
				default:
					packageObject[metadataName] = metadataValue;
					break;
			}
		}

		switch (packageObject['packageMetadataVersion']) {
			case 2:
				for (const metadataName in fileMetadataV2Offsets) {
					const startOffset = parseInt(fileMetadataV2Offsets[metadataName][0], 16);
					const endOffset = parseInt(fileMetadataV2Offsets[metadataName][1], 16);

					const metadataValue = Array.from(fileContent.slice(startOffset, endOffset)).map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();

					switch (metadataName) {
						case 'packageSeasonNumber':
						case 'packageEpisodeNumber':
							packageObject[metadataName] = (parseInt(metadataValue, 16) << 16) >> 16;
							break;
						case 'packageThumbnailImage':
						case 'packageTitleThumbnailImage':
							packageObject[metadataName] = new Blob([new Uint8Array(metadataValue.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))], { type: 'image/png' });
							break;
						case 'packageAdditionalDisplayNames':
						case 'packageAdditionalDisplayDesc':
							packageObject[metadataName] = metadataValue.match(/.{1,512}/g).map((locale) => Array.from({ length: locale.length / 4 }, (_, i) => String.fromCharCode(parseInt(locale.substr(i * 4, 4), 16))).join('').replace(/\u0000/g, ''));
							break;
						default:
							packageObject[metadataName] = metadataValue;
							break;
					}
				}
				break;
			default:
				for (const metadataName in fileMetadataV1Offsets) {
					const startOffset = parseInt(fileMetadataV1Offsets[metadataName][0], 16);
					const endOffset = parseInt(fileMetadataV1Offsets[metadataName][1], 16);

					const metadataValue = Array.from(fileContent.slice(startOffset, endOffset)).map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();

					switch (metadataName) {
						case 'packageThumbnailImageSize':
						case 'packageTitleThumbnailImageSize':
							packageObject[metadataName] = Number(BigInt.asIntN(32, BigInt(`0x${metadataValue}`)));
							break;
						case 'packageThumbnailImage':
						case 'packageTitleThumbnailImage':
							packageObject[metadataName] = new Blob([new Uint8Array(metadataValue.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))], { type: 'image/png' });
							break;
					}
				}
				break;
		}

		return packageObject;
	} catch (error) {
		console.error(error);
		return null;
	}
}

export function readPackageMagic(packageMagic) {

	if (!/^[0-9A-F]+$/g.test(packageMagic)) {
		throw new Error('Invalid packageMagic: It must consist of valid hexadecimal characters (0-9, A-F).');
	}

	return packageMagic.match(/.{1,2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join('');

}

export function readPackageContentType(packageContentType) {

	if (typeof packageContentType !== 'number' || isNaN(packageContentType)) {
		throw new Error('Invalid packageContentType: It must be a valid numerical value.');
	}

	const fileContentTypes = {
		'0x0000001': 'Saved Game',
		'0x0000002': 'Marketplace Content',
		'0x0000003': 'Publisher',
		'0x0001000': 'Xbox 360 Title',
		'0x0002000': 'IPTV Pause Buffer',
		'0x0004000': 'Installed Game',
		'0x0005000': 'Xbox Original Game',
		'0x0005000': 'Xbox Title',
		'0x0007000': 'Game on Demand',
		'0x0009000': 'Avatar Item',
		'0x0010000': 'Profile',
		'0x0020000': 'Gamer Picture',
		'0x0030000': 'Theme',
		'0x0040000': 'Cache File',
		'0x0050000': 'Storage Download',
		'0x0060000': 'Xbox Saved Game',
		'0x0070000': 'Xbox Download',
		'0x0080000': 'Game Demo',
		'0x0090000': 'Video',
		'0x00A0000': 'Game Title',
		'0x00B0000': 'Installer',
		'0x00C0000': 'Game Trailer',
		'0x00D0000': 'Arcade Title',
		'0x00E0000': 'XNA',
		'0x00F0000': 'License Store',
		'0x0100000': 'Movie',
		'0x0200000': 'TV',
		'0x0300000': 'Music Video',
		'0x0400000': 'Game Video',
		'0x0500000': 'Podcast Video',
		'0x0600000': 'Viral Video',
		'0x2000000': 'Community Game',
	};

	return fileContentTypes[`0x${packageContentType.toString(16).padStart(7, '0')}`];

}