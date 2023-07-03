import addLikes from "./addLikes.js";
import { Composer } from "telegraf";

export default Composer.action(/^data-(.*?)$/, (ctx) => {
  addLikes(ctx.match[1]).then(() => {
    return ctx.answerCbQuery(`Лайкнуто! 👍`);
  });
});
