import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/common";

export enum TYPE_CONTENT_DEFINE {
    about = "ABOUT",
    faq = "FAQ",
    faqDriver = "FAQ_DRIVER",
    howTouUse = "HOW_TO_USE",
    howToUseDriver = "HOW_TO_USE_DRIVER",
    security = "SECURITY",
    termCondition = "TERM_CONDITION",
    howToDeposit = 'HOW_TO_DEPOSIT'
}

@Entity(addPrefix("content_define"))
export class ContentDefine extends CoreEntity {
    constructor() {
        super()
    }

    @PrimaryGeneratedColumn()
    @Property()
    id: number;

    @Column()
    @Property()
    title: string;

    @Column()
    @Property()
    image: string

    @Column({ type: "text" })
    @Property()
    body: string

    @Column()
    @Property()
    type: TYPE_CONTENT_DEFINE;
}
