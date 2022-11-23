import { faker } from "@faker-js/faker"
import _ from "lodash"
import fs from "node:fs/promises"

const USERS_COUNT = 20
const MIN_FOLLOWS_COUNT = 2
const MAX_FOLLOWS_COUNT = 10
const MIN_MESSAGES_COUNT = 2
const MAX_MESSAGES_COUNT = 10
const MAX_MESSAGES_SENTENCES = 3
const MIN_MESSAGE_DATE = 1577836800000
const MAX_MESSAGE_DATE = Date.now()
const MAX_POSTS_COUNT = 5
const MAX_TITLE_LENGTH = 4
const POST_IMAGE_WIDTH = 480
const POST_IMAGE_HEIGHT = 270
const SAVE_PATH = "./tables/"
const IS_DYNAMODB = true

let users = []
let messages = []
let posts = []

const generateDate = () => {
	const date = faker.datatype.datetime({ min: MIN_MESSAGE_DATE, max: MAX_MESSAGE_DATE })
	return date.getTime()
}

const generateUniqueNumbersArray = (arrayLength, maxNumber) => {
	let uniqueArray = []
	if (arrayLength < maxNumber) {
		let arrayNumber = 0
		_.times(faker.datatype.number(arrayLength), () => {
			arrayNumber = faker.datatype.number({ min: MIN_FOLLOWS_COUNT, max: MAX_FOLLOWS_COUNT })
			if (IS_DYNAMODB) {
				arrayNumber = arrayNumber.toString()
			}
			while (!uniqueArray.includes(arrayNumber)) {
				uniqueArray = [...uniqueArray, arrayNumber]
			}
		})
	}
	uniqueArray.sort((a, b) => a - b)
	return uniqueArray
}

const createRandomUser = (userId) => {
	const gender = faker.datatype.boolean() ? "male" : "female"
	const firstName = faker.name.firstName(gender)
	const lastName = faker.name.lastName(gender)
	const provider = "example.com"
	const email = faker.internet.email(firstName, lastName, provider)
	const avatarUrl = faker.image.avatar()
	const userName = faker.internet.userName(firstName, lastName)
	let user = {}
	if (IS_DYNAMODB) {
		user = {
			userId: { N: userId.toString() },
			firstName: { S: firstName },
			lastName: { S: lastName },
			email: { S: email },
			avatarUrl: { S: avatarUrl },
			userName: { S: userName },
			isActive: { N: "1" },
			followed: { NS: generateUniqueNumbersArray(USERS_COUNT - 2, USERS_COUNT) },
		}
	} else {
		user = {
			userId: userId,
			firstName: firstName,
			lastName: lastName,
			email: email,
			avatarUrl: avatarUrl,
			userName: userName,
			isActive: 1,
			followed: generateUniqueNumbersArray(USERS_COUNT - 2, USERS_COUNT),
		}
	}

	users = [...users, user]
}

const createMessages = (userId) => {
	const userMessagesCount = faker.datatype.number({
		max: MAX_MESSAGES_COUNT,
		min: MIN_MESSAGES_COUNT,
	})
	Array.from({ length: USERS_COUNT }).forEach((el, index) => {
		if (index + 1 !== userId) {
			messages = [...messages, ...generateUserMessages(userMessagesCount, userId, index + 1)]
		}
	})
}

const generateMessage = (userId, targetUserId, messageId) => {
	const unixTimestamp = generateDate()
	const text = faker.lorem.sentences(faker.datatype.number({ max: MAX_MESSAGES_SENTENCES, min: 1 }))
	if (IS_DYNAMODB) {
		return {
			messageId: { N: messageId.toString() },
			text: { S: text },
			unixTimestamp: { N: unixTimestamp.toString() },
			targetUserId: { N: targetUserId.toString() },
			userId: { N: userId.toString() },
		}
	} else {
		return {
			messageId: messageId,
			text: text,
			unixTimestamp: unixTimestamp,
			targetUserId: targetUserId,
			userId: userId,
		}
	}
}

let lastMessageId = 1

const generateUserMessages = (userMessagesCount, userId, targetUserId) => {
	let correspondence = Array.from({ length: userMessagesCount }).map((el, index) =>
		generateMessage(userId, targetUserId, index + lastMessageId)
	)
	lastMessageId = lastMessageId + userMessagesCount
	return correspondence
}

const generatePost = (id, userId) => {
	const title = faker.lorem.sentence(faker.datatype.number({ max: MAX_TITLE_LENGTH, min: 2 }))
	const text = faker.lorem.text()
	const unixTimestamp = generateDate()
	const imageUrl = faker.image.abstract(POST_IMAGE_WIDTH, POST_IMAGE_HEIGHT, true)
	if (IS_DYNAMODB) {
		return {
			postId: { N: id.toString() },
			userId: { N: userId.toString() },
			title: { S: title },
			text: { S: text },
			imageUrl: { S: imageUrl },
			unixTimestamp: { N: unixTimestamp.toString() },
			isActive: { N: "1" },
		}
	} else {
		return {
			postId: id,
			userId: userId,
			title: title,
			text: text,
			imageUrl: imageUrl,
			unixTimestamp: unixTimestamp,
			isActive: 1,
		}
	}
}

let lastPostId = 1

const createPosts = (userId) => {
	const postCount = faker.datatype.number({ max: MAX_POSTS_COUNT, min: 1 })
	let newPost = Array.from({ length: postCount }).map((el, index) =>
		generatePost(index + lastPostId, userId)
	)
	posts = [...posts, ...newPost]
	lastPostId = lastPostId + postCount
}

const sortByNumber = (a, b) => {
	if (a < b) {
		return -1
	} else if (a > b) {
		return 1
	}
	return 0
}

Array.from({ length: USERS_COUNT }).forEach((el, index) => {
	let userId = index + 1
	createRandomUser(userId)
	createMessages(userId)
	createPosts(userId)
})

const saveData = async (content, filename) => {
	let newContent = ""
	if (IS_DYNAMODB) {
		filename = "dynamodb_" + filename
		newContent = JSON.stringify(
			{
				Items: content,
			},
			null,
			"\t"
		)
	} else {
		newContent = JSON.stringify(content, null, "\t")
	}

	try {
		await fs.writeFile(SAVE_PATH + filename + ".json", newContent)
		console.log("Finished " + filename + "!")
	} catch (error) {
		console.log(error)
	}
}

saveData(users, "users")
saveData(posts, "posts")
saveData(messages, "messages")
