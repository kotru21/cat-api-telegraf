import AddLikes from "./AddLikes.js";
import { Composer } from "telegraf";

export default Composer.action(/^data-(.*?)$/, (ctx) => {
  AddLikes(ctx.match[1]).then(() => {
    return ctx.answerCbQuery(`Param: ${ctx.match[1]}! 👍`);
  });
});
