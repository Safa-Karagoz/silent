import type {GetServerSidePropsContext, InferGetServerSidePropsType} from "next";
import {getProviders} from "next-auth/react";
import {getServerSession} from "next-auth/next";
import {authOptions} from "../api/auth/[...nextauth]";
import AuthProviderBlock from "@/components/auth/AuthProviderBlock";
import { JSX } from "react";

const SignIn = ({
    providers
}: InferGetServerSidePropsType<typeof getServerSideProps>): JSX.Element => {
    return (
        <div className="h-screen w-screen m-auto flex place-content-center bg-secondary-50">
            <div className="flex flex-col place-content-center m-auto w-full h-screen">
                <div className="w-5/6 sm:w-1/3 h-3/5 m-auto border border-accent-neutral/50 rounded-xl bg-secondary-100 shadow-2xl">
                    <div className="h-1/4">
                        <div className="bg-clip-text py-3 bg-primary-100 pt-8">
                            <h1 className="text-center text-5xl font-extrabold">
                                Dementia Friend
                            </h1>
                        </div>
                        <h3 className="text-center text-2xl text-primary-75 font-semibold">
                            Sign In
                        </h3>
                        <hr className="w-2/3 border-primary-100 mx-auto mt-4 mb-6"></hr>
                    </div>
                    <div className="flex flex-col h-3/4 py-8 place-content-start overflow-y-scroll space-y-4">
                        <>
                            {Object.values(providers).map((provider, idx) => (
                                <AuthProviderBlock
                                    key={provider.id}
                                    providerName={provider.name}
                                    iconLink={`/providers/${provider.id}.png`}
                                    provider={provider}
                                />
                            ))}
                        </>
                    </div>
                </div>
            </div>
        </div>
    );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const session = await getServerSession(context.req, context.res, authOptions);

    // If the user is already logged in, redirect.
    // Note: Make sure not to redirect to the same page
    // To avoid an infinite loop!
    if (session) {
        return {redirect: {destination: "/"}};
    }

    const providers = await getProviders();

    // TODO --> If no providers, this should error or something
    return {
        props: {providers: providers ?? []}
    };
}

export default SignIn;