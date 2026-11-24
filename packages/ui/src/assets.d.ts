/** Static image imports, resolved by the Next.js bundler of the consuming app. */
declare module "*.png" {
	const image: { src: string; width: number; height: number; blurDataURL?: string };
	export default image;
}
