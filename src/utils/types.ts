import { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import { Context, SessionFlavor } from "grammy";

export type BotContext = Context & ConversationFlavor;
export type BotConversation = Conversation<BotContext>;
