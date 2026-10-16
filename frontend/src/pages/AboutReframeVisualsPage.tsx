import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

const AboutReframeVisualsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>About Reframe Visuals | E-commerce Photo Editing Studio</title>
        <meta
          name="description"
          content="Learn what Reframe Visuals does: e-commerce photo editing, retouching, and post-production for brands. Not a video reframing tool."
        />
        <link rel="canonical" href="https://reframevisuals.com/about-reframe-visuals" />
      </Helmet>

      <section className="max-w-4xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
        <p className="text-xs font-black tracking-[0.2em] uppercase text-black/40 mb-3">Brand clarity</p>
        <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-black mb-6">About Reframe Visuals</h1>
        <p className="text-lg text-black/70 leading-relaxed mb-6">
          Reframe Visuals edits product photos for online brands. Background removal, clipping paths,
          ghost mannequin, retouching, and color correction handled by human editors with QA on every file.
        </p>
        <p className="text-base text-black/65 leading-relaxed mb-10">
          Important: Reframe Visuals is not a video reframing app or AI reframing software. We are a service team
          focused on product image workflows for catalogs, marketplaces, and ad creatives.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Button asChild variant="secondary" className="w-full">
            <Link to="/services">Explore services</Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link to="/contact">Contact the team</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default AboutReframeVisualsPage;
