# Upload Videos and Community Post on Youtube

Upload videos and community post (poll and images) on youtube using node js without youtube api.

### Installation

```bash
npm install --save youtube-all-in-one-uploader
```

```bash
yarn add youtube-all-in-one-uploader
```

## Usage

##### Upload Video

```javascript
const Youtube = require("youtube-all-in-one-uploader");
const upload = async () => {
  const youtube = new Youtube();
  await youtube.load();
  await youtube.login(email, password);
  await youtube.uploadVideo({
    title: "My video",
    description: "My description",
    path: "./video.mp4",
  });
};
```

##### Upload Community Post

```javascript
const Youtube = require("youtube-all-in-one-uploader");
const upload = async () => {
  const youtube = new Youtube();
  await youtube.load();
  await youtube.login(email, password);

  //   Image upload
  await youtube.uploadCommunityPost({
    title: "My video",
    img: [img, img2],
  });
  //   Voting poll upload
  await youtube.uploadCommunityPost({
    title: "My video",
    options: ["option 1", "option 2"],
  });
};
```
