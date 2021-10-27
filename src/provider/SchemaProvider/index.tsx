import React, {useContext} from "react";


export type PageSchemaPropsType = {
    name?: string
}

/**
 * 自定义Schema配置，将和动态生成的schema合并覆盖
 */
export type SchemaContextPropsType = {
    schemaMap: Record<string, PageSchemaPropsType>
}

const SchemaContext = React.createContext<SchemaContextPropsType>({schemaMap: {test: {name: 'TEST'}}});

const SchemaProviderWrap: React.FC<Record<string, unknown>> = ({children}) => {
    const Provider = React.Fragment;

    return (
        <SchemaConsumer>
            {(value) => {

                const schemaProvider = {};

                return (
                    <Provider {...schemaProvider}>
                        <SchemaProvider
                            value={{
                                ...value,
                            }}
                        >
                            {children}
                        </SchemaProvider>
                    </Provider>
                );
            }}
        </SchemaConsumer>
    );
};

const {Consumer: SchemaConsumer, Provider: SchemaProvider} = SchemaContext;

export {SchemaConsumer, SchemaProvider};

export function useSchema(pageName: string): PageSchemaPropsType {
    const context = useContext(SchemaContext);
    const {schemaMap} = context;
    return schemaMap[pageName];
}