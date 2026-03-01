"use client";

import { Listing } from "@/types/listing";
import { ListingCard } from "./listing-card";
import { motion, useReducedMotion } from "framer-motion";

interface ListingGridProps {
  listings: Listing[];
}

export function ListingGrid({ listings }: ListingGridProps) {
  const reduceMotion = useReducedMotion();

  if (listings.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500">No projects found matching your filters.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      initial={reduceMotion ? undefined : "hidden"}
      animate={reduceMotion ? undefined : "visible"}
      variants={
        reduceMotion
          ? undefined
          : {
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }
      }
    >
      {listings.map((listing) => (
        <motion.div
          key={listing.id}
          className="h-full"
          variants={
            reduceMotion
              ? undefined
              : {
                  hidden: { opacity: 0, y: 14 },
                  visible: { opacity: 1, y: 0 },
                }
          }
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <ListingCard listing={listing} />
        </motion.div>
      ))}
    </motion.div>
  );
}
