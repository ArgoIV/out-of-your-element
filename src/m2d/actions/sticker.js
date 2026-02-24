// @ts-check

const streamr = require("stream")
const {pipeline} = require("stream").promises

const {sync} = require("../../passthrough")
const sharp = require("sharp")
/** @type {import("../../matrix/api")} */
const api = sync.require("../../matrix/api")
/** @type {import("../../matrix/mreq")} */
const mreq = sync.require("../../matrix/mreq")
const streamMimeType = require("stream-mime-type")

const WIDTH = 160
const HEIGHT = 160
/**
 * Downloads the sticker from the web and converts to webp data.
 * @param {string} mxc a single mxc:// URL
 * @returns {Promise<Buffer | undefined>} sticker webp data, or undefined if the downloaded sticker is not valid
 */
async function getAndResizeSticker(mxc) {
	const res = await api.getMedia(mxc)
	if (res.status !== 200) {
		const root = await res.json()
		throw new mreq.MatrixServerError(root, {mxc})
	}
	const streamIn = streamr.Readable.fromWeb(res.body)

	const { stream, mime } = await streamMimeType.getMimeType(streamIn)
	let animated = false
	if (mime === "image/gif" || mime === "image/webp") {
		animated = true
	}

	const result = await new Promise((resolve, reject) => {
		const transformer = sharp({animated: animated})
			.resize(WIDTH, HEIGHT, {fit: "inside", background: {r: 0, g: 0, b: 0, alpha: 0}})
			.webp()
			.toBuffer((err, buffer, info) => {
				/* c8 ignore next */
				if (err) return reject(err)
				resolve({info, buffer})
			})
		pipeline(
			stream,
			transformer
		)
	})
	return result.buffer
}


module.exports.getAndResizeSticker = getAndResizeSticker
