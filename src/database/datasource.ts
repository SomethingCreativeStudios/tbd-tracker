import { DataSource } from "typeorm";
import { ConfigService } from "../config";
import { TypeOrmOptions } from "./TypeOrmOptions";

const dataOptions = new TypeOrmOptions(new ConfigService());

export default new DataSource(dataOptions.createTypeOrmOptions());