package com.naada.apigateway.config;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;

/**
 * Seeds the Pinecone knowledge base with foundational Sinhala classical music
 * documents on first startup. Subsequent runs are idempotent — if the vector
 * store already contains data, the seeder is skipped.
 */
@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final VectorStore vectorStore;

    public DataInitializer(ObjectProvider<VectorStore> vectorStoreProvider) {
        VectorStore store = null;
        try {
            store = vectorStoreProvider.getIfAvailable();
        } catch (Exception e) {
            logger.debug("VectorStore unavailable for DataInitializer: {}", e.getMessage());
        }
        this.vectorStore = store;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (vectorStore == null) {
            logger.info("VectorStore not configured — skipping knowledge base seeding.");
            return;
        }

        try {
            // Idempotency check: query for existing documents
            List<Document> existing = vectorStore.similaritySearch(
                    SearchRequest.builder().query("Sinhala classical music").topK(1).build()
            );
            if (existing != null && !existing.isEmpty()) {
                logger.info("Pinecone already contains seed data ({} doc(s) found) — skipping ingestion.",
                        existing.size());
                return;
            }

            logger.info("Seeding foundational Sinhala classical music knowledge into Pinecone...");

            List<Document> docs = List.of(
                    new Document(
                            "Song: Ninda Nena Rathriye\n"
                            + "Artist: Pandit W.D. Amaradeva\n"
                            + "Genre: Sinhala Classical\n"
                            + "Difficulty: Intermediate (5.5 / 10)\n"
                            + "Taal (Rhythm): Dadra — a 6-beat rhythmic cycle "
                            + "(dha dhin na | dha tin na) commonly used in light classical "
                            + "and semi-classical compositions.\n"
                            + "Theme: Solitude and longing. The lyrics evoke deep nocturnal "
                            + "solitude — a sleepless night where dreams and reality blur, "
                            + "reflecting on love, separation, and the passage of time.\n"
                            + "Instruments: Sitar, tabla, tanpura, flute.\n"
                            + "Cultural significance: One of the most beloved compositions "
                            + "by Sri Lanka's foremost classical musician, Pandit W.D. Amaradeva. "
                            + "The song blends Hindustani raga foundations with Sinhala poetic traditions.",
                            Map.of("title", "Ninda Nena Rathriye",
                                   "artist", "Pandit W.D. Amaradeva",
                                   "genre", "Sinhala Classical",
                                   "difficultyLabel", "Intermediate",
                                   "difficultyScore", 5.5)
                    ),
                    new Document(
                            "Song: Maha Wessaka\n"
                            + "Artist: Pandit W.D. Amaradeva\n"
                            + "Genre: Sinhala Classical\n"
                            + "Difficulty: Intermediate (5.0 / 10)\n"
                            + "Taal (Rhythm): Keherwa — an 8-beat rhythmic cycle "
                            + "(dha ge na ti | na ka dhi na) frequently used in bhajans, "
                            + "folk, and light classical music.\n"
                            + "Theme: Monsoonal rain and nostalgia. The lyrics paint vivid "
                            + "imagery of the Vesak season with its monsoon rains, describing "
                            + "the emotional landscape of longing and memory intertwined with nature.\n"
                            + "Instruments: Tabla, harmonium, sitar, flute.\n"
                            + "Cultural significance: Amaradeva's mastery of blending Hindustani "
                            + "ragas with Sinhala lyrics is exemplified in this piece, celebrating "
                            + "seasonal beauty and Buddhist cultural festivities.",
                            Map.of("title", "Maha Wessaka",
                                   "artist", "Pandit W.D. Amaradeva",
                                   "genre", "Sinhala Classical",
                                   "difficultyLabel", "Intermediate",
                                   "difficultyScore", 5.0)
                    ),
                    new Document(
                            "Song: Galana Gangaki Jeewithe\n"
                            + "Artist: Victor Rathnayake\n"
                            + "Genre: Sinhala Classical\n"
                            + "Difficulty: Advanced (7.5 / 10)\n"
                            + "Taal (Rhythm): Keherwa — an 8-beat rhythmic cycle.\n"
                            + "Theme: Human existence and transience. The flowing river "
                            + "metaphor represents the impermanence of life (anicca), a core "
                            + "Buddhist philosophical concept. The lyrics contemplate mortality, "
                            + "purpose, and the beauty found in life's fleeting moments.\n"
                            + "Instruments: Tabla, sitar, tanpura, violin.\n"
                            + "Cultural significance: Victor Rathnayake is regarded as one of "
                            + "Sri Lanka's greatest vocalists. This composition bridges classical "
                            + "ragas with modern Sinhala songwriting, offering philosophical depth "
                            + "that resonates with Buddhist teachings on impermanence.",
                            Map.of("title", "Galana Gangaki Jeewithe",
                                   "artist", "Victor Rathnayake",
                                   "genre", "Sinhala Classical",
                                   "difficultyLabel", "Advanced",
                                   "difficultyScore", 7.5)
                    )
            );

            vectorStore.add(docs);
            logger.info("Successfully seeded {} documents into Pinecone.", docs.size());

        } catch (Throwable e) {
            logger.warn("Could not seed Pinecone knowledge base (API keys may not be configured): {}",
                    e.getMessage());
        }
    }
}